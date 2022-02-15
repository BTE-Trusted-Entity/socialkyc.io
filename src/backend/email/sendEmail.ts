import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

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
  MessageBodyType,
} from '@kiltprotocol/types';

import { configuration } from '../utilities/configuration';
import {
  getSecretForSession,
  getSession,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';

import { preDecryptMessageContent } from '../utilities/decryptMessage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { exceptionToError } from '../../frontend/utilities/exceptionToError';
import { exitOnError } from '../utilities/exitOnError';
import { paths } from '../endpoints/paths';

import { sesClient } from './sesClient';

const rateLimiter = new RateLimiterMemory({
  duration: 1 * 60,
  points: 5,
});

const htmlTemplatePromise = readFile(
  join(configuration.distFolder, 'email.html'),
  { encoding: 'utf-8' },
);

htmlTemplatePromise.catch(exitOnError);

async function send(url: string, email: string): Promise<void> {
  const Data = `Please confirm your email address by clicking on this link:

${url}

Congrats! You’ve just completed the first step to regaining control over your digital identity.

--\u0020
Thanks,
The SocialKYC Team


The SocialKYC identity verification service is brought to you by B.T.E. BOTLabs Trusted Entity GmbH, a subsidiary of BOTLabs GmbH, the entity that initially developed KILT Protocol.`;

  // Cannot inline the images, webmails ignore them or even drop styles
  const html = (await htmlTemplatePromise)
    .replace('${URL}', url)
    .replace(/src="/g, `src="${configuration.baseUri}`)
    .replace(/url\((['"]?)/g, `url($1${configuration.baseUri}/`);

  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: [email],
    },
    Source: '"SocialKYC" <attester@socialkyc.io>',
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'SocialKYC – Please confirm your email address',
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data,
        },
        Html: {
          Charset: 'UTF-8',
          Data: html,
        },
      },
    },
  });

  await sesClient.send(command);
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
  delete session.attestationPromise;
  setSession({ ...session, requestForAttestation, confirmed: false });
  logger.debug('Email request attestation cached');

  const secret = getSecretForSession(session.sessionId);
  const path = paths.email.confirmationHtml.replace('{secret}', secret);
  const url = `${configuration.baseUri}${path}`;

  try {
    await send(url, requestForAttestation.claim.contents.Email as string);
    logger.debug('Email request attestation message sent');

    return requestForAttestation.claim.contents['Email'] as string as Output;
  } catch (exception) {
    const error = exceptionToError(exception);
    logger.error(`Error sending email: ${error}`);

    throw Boom.boomify(error, {
      statusCode: 400,
      message: 'Invalid email syntax',
    });
  }
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
