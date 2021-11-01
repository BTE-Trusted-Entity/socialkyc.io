import { StatusCodes } from 'http-status-codes';
import { SendEmailCommand } from '@aws-sdk/client-ses';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { IRequestForAttestation, MessageBodyType } from '@kiltprotocol/types';
import { errorCheckMessageBody } from '@kiltprotocol/messaging';
import { RequestForAttestation } from '@kiltprotocol/core';

import { configuration } from '../utilities/configuration';
import { cacheRequestForAttestation } from '../utilities/requestCache';
import { sesClient } from '../utilities/sesClient';
import { decryptMessage } from '../utilities/decryptMessage';
import {
  Payload,
  validateEncryptedMessage,
} from '../utilities/validateEncryptedMessage';
import { paths } from './paths';

const rateLimiter = new RateLimiterMemory({
  duration: 1 * 60,
  points: 5,
});

async function send(
  url: string,
  requestForAttestation: IRequestForAttestation,
): Promise<void> {
  const { contents } = requestForAttestation.claim;

  const email = contents['Email'] as string;

  const params = {
    Destination: {
      ToAddresses: [email],
    },
    Source: 'test@socialkyc.io',
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'SocialKYC - Confirm your email address',
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: `Hello,\n\nThis is a test. Please click the link to confirm your email: ${url} \n\nKind regards,\nSocialKYC`,
        },
      },
    },
  };
  await sesClient.send(new SendEmailCommand(params));
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject | string> {
  try {
    await rateLimiter.consume(request.info.remoteAddress);
  } catch {
    throw Boom.tooManyRequests(
      'Too many requests, please try again in an hour.',
    );
  }

  const encrypted = request.payload as Payload;
  const message = await decryptMessage(encrypted);

  const messageBody = message.body;
  errorCheckMessageBody(messageBody);

  const { type } = messageBody;
  if (type === MessageBodyType.REJECT_TERMS) {
    return h.response().code(StatusCodes.ACCEPTED);
  }
  if (type !== MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM) {
    return h.response().code(StatusCodes.NOT_ACCEPTABLE);
  }

  const { requestForAttestation } = messageBody.content;
  if (!RequestForAttestation.isIRequestForAttestation(requestForAttestation)) {
    throw Boom.badRequest('Invalid request for attestation');
  }

  RequestForAttestation.verifyData(requestForAttestation);

  const key = requestForAttestation.rootHash;
  cacheRequestForAttestation(key, requestForAttestation);

  const path = paths.confirmationHtml.replace('{key}', key);
  const url = `${configuration.baseUri}${path}`;

  await send(url, requestForAttestation);

  return requestForAttestation.claim.contents['Email'] as string;
}

export const request: ServerRoute = {
  method: 'POST',
  path: paths.requestAttestationEmail,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
