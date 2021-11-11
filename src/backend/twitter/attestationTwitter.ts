import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';
import { IEncryptedMessage } from '@kiltprotocol/types';

import {
  getSession,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

const zodPayload = z.object({
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter attestation started');

  const session = getSession(request.payload as PayloadWithSession);
  if (!session.attestedMessagePromise) {
    throw Boom.notFound('Promised attestation not found');
  }

  try {
    logger.debug('Twitter attestation attesting');
    const response = await session.attestedMessagePromise;
    delete session.attestedMessagePromise;
    delete session.requestForAttestation;
    setSession(session);

    logger.debug('Twitter attestation completed');
    return h.response(response as Output);
  } catch (error) {
    throw Boom.internal('Attestation failed', error);
  }
}

export const attestationTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.attest,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
