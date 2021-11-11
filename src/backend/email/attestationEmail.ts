import { IEncryptedMessage } from '@kiltprotocol/types';
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
  getSessionWithDid,
  setSession,
} from '../utilities/sessionStorage';
import { attestClaim } from '../utilities/attestClaim';
import { paths } from '../endpoints/paths';

const zodPayload = z.object({
  secret: z.string(),
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Email attestation started');

  const { secret, sessionId } = request.payload as Input;

  // This is the initial session in the first tab the user has open
  const firstSession = getSessionBySecret(secret);
  const { requestForAttestation } = firstSession;
  if (!requestForAttestation) {
    throw Boom.notFound('requestForAttestation not found');
  }

  // Clicking the confirmation link in the email opens a new tab with a new session
  const currentSession = getSessionWithDid({ sessionId });
  const { did } = currentSession;
  logger.debug('Email attestation found request');
  setSession({ ...currentSession, requestForAttestation });

  try {
    const response = await attestClaim(requestForAttestation, did);
    logger.debug('Email attestation completed');

    deleteSecret(secret);
    delete currentSession.requestForAttestation;
    setSession(currentSession);
    delete firstSession.requestForAttestation;
    setSession(firstSession);

    return h.response(response as Output);
  } catch (error) {
    throw Boom.internal('Attestation failed', error);
  }
}

export const attestationEmail: ServerRoute = {
  method: 'POST',
  path: paths.email.attest,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
