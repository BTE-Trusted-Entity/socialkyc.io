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
  getSession,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';
import { getAttestationMessage } from '../utilities/attestClaim';
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
  logger.debug('Email attestation started');

  const session = getSession(request.payload as PayloadWithSession);

  try {
    const response = await getAttestationMessage(session);
    logger.debug('Email attestation completed');

    delete session.requestForAttestation;
    setSession(session);

    return h.response(response as Output);
  } catch (error) {
    throw Boom.boomify(error as Error, {
      message: 'Attestation failed',
      override: false,
    });
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
