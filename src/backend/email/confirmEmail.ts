import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
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

export type Output = undefined;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Session data migration started');

  const { secret } = request.payload as Input;

  // This is the initial session in the first tab the user has open
  const firstSession = getSessionBySecret(secret);
  const { requestForAttestation, attestationPromise, confirmed } = firstSession;
  if (!requestForAttestation) {
    throw Boom.notFound('requestForAttestation not found');
  }
  if (requestForAttestation.claim.cTypeHash !== emailCType.hash) {
    throw Boom.notFound('requestForAttestation cType mismatch');
  }

  // Clicking the confirmation link in the email opens a new tab with a new session
  const currentSession = getSession(request.headers);

  // carry over the request and attestation promise to the current session and clean up the initial one
  setSession({
    ...currentSession,
    requestForAttestation,
    attestationPromise,
    confirmed,
  });
  delete firstSession.requestForAttestation;
  delete firstSession.attestationPromise;
  delete firstSession.confirmed;
  setSession(firstSession);
  deleteSecret(secret);

  logger.debug('Session data migration complete');

  return h.response(<Output>undefined); // never seen that syntax before, why do we need that?
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
