import { SendEmailCommand } from '@aws-sdk/client-ses';
import { Request, ServerRoute } from '@hapi/hapi';
import Boom from '@hapi/boom';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import { IRequestForAttestation } from '@kiltprotocol/types';
import { RequestForAttestation } from '@kiltprotocol/core';

import { configuration } from '../utilities/configuration';
import { cacheRequestForAttestation } from '../utilities/requestCache';
import { sesClient } from '../utilities/sesClient';

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
  const name = contents['Full name'] as string;

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
          Data: `Hello ${name},\n\nThis is a test. Please click the link to confirm your email: ${url} \n\nKind regards,\nSocialKYC`,
        },
      },
    },
  };
  await sesClient.send(new SendEmailCommand(params));
}

async function handler(request: Request): Promise<string> {
  try {
    await rateLimiter.consume(request.info.remoteAddress);
  } catch {
    throw Boom.tooManyRequests(
      'Too many requests, please try again in an hour.',
    );
  }

  const requestForAttestation = request.payload as IRequestForAttestation;

  const key = requestForAttestation.rootHash;
  cacheRequestForAttestation(key, requestForAttestation);

  const url = `${configuration.baseUri}/confirmation/${key}`;

  await send(url, requestForAttestation);

  return '';
}

export const request: ServerRoute = {
  method: 'POST',
  path: '/request-attestation',
  handler,
  options: {
    validate: {
      payload: async (payload) => {
        RequestForAttestation.isIRequestForAttestation(payload);
      },
    },
  },
};
