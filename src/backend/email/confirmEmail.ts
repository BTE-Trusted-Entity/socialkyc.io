import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { CType } from '@kiltprotocol/core';
import { z } from 'zod';

import {
  deleteSecret,
  getSessionBySecret,
  getSession,
  setSession,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { emailCType } from './emailCType';

const zodPayload = z.object({
  secret: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export interface Output {
  Email: string;
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Session data migration started');

  const { secret } = request.payload as Input;

  // This is the initial session in the first tab the user has open
  const firstSession = getSessionBySecret(secret);
  if (!firstSession) {
    throw Boom.notFound('No session found for secret');
  }
  const { claim } = firstSession;
  if (!claim) {
    throw Boom.notFound('Claim not found');
  }
  if (CType.hashToId(claim.cTypeHash) !== emailCType.$id) {
    throw Boom.notFound('Claim cType mismatch');
  }

  // Clicking the confirmation link in the email opens a new tab with a new session
  const currentSession = getSession(request.headers);

  // carry over the claim to the current session and clean up the initial one
  setSession({
    ...currentSession,
    claim,
    confirmed: true,
  });
  delete firstSession.claim;
  setSession(firstSession);
  deleteSecret(secret);

  logger.debug('Email claim confirmed');

  return h.response(claim.contents as unknown as Output);
}

export const confirmEmail: ServerRoute = {
  method: 'POST',
  path: paths.email.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
