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
import {
  IRequestAttestationContent,
  IRequestForAttestation,
  MessageBodyType,
} from '@kiltprotocol/types';

import { configuration } from '../utilities/configuration';
import {
  getSecretForSession,
  getSession,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';
import { sesClient } from './sesClient';
import { preDecryptMessageContent } from '../utilities/decryptMessage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';

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
    Source: '"SocialKYC" <attester@socialkyc.io>',
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'SocialKYC - Confirm your email address',
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: `Hello,\n\nPlease click the link to confirm your email: ${url} \n\nKind regards,\nSocialKYC`,
        },
      },
    },
  };
  await sesClient.send(new SendEmailCommand(params));
}

export type Output = string;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject | string> {
  const { logger } = request;
  logger.debug('Email request attestation started');

  try {
    await rateLimiter.consume(request.info.remoteAddress);
    logger.debug('Email request attestation rate limit OK');
  } catch {
    throw Boom.tooManyRequests(
      'Too many requests, please try again in an hour.',
    );
  }

  if (!request.pre.content) {
    return h.response().code(StatusCodes.ACCEPTED);
  }

  const content = request.pre.content as IRequestAttestationContent;
  const { requestForAttestation } = content;

  const session = getSession(request.payload as PayloadWithSession);
  delete session.attestedMessagePromise;
  setSession({ ...session, requestForAttestation, confirmed: false });
  logger.debug('Email request attestation cached');

  const secret = getSecretForSession(session.sessionId);
  const path = paths.confirmationHtml.replace('{secret}', secret);
  const url = `${configuration.baseUri}${path}`;

  await send(url, requestForAttestation);
  logger.debug('Email request attestation message sent');

  return requestForAttestation.claim.contents['Email'] as string as Output;
}

export const request: ServerRoute = {
  method: 'POST',
  path: paths.email.requestAttestation,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
    pre: [
      {
        assign: 'content',
        method: preDecryptMessageContent(
          MessageBodyType.REQUEST_ATTESTATION,
          MessageBodyType.REJECT_TERMS,
        ),
      },
    ],
  },
};
