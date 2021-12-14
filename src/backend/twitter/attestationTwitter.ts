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
import { getAttestationMessage } from '../utilities/attestClaim';
import { exceptionToError } from '../../frontend/utilities/exceptionToError';
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

  try {
    const response = await getAttestationMessage(session);
    delete session.requestForAttestation;
    setSession(session);

    logger.debug('Twitter attestation completed');
    return h.response(response as Output);
  } catch (exception) {
    const error = exceptionToError(exception);

    throw Boom.boomify(error, {
      message: 'Attestation failed',
      override: false,
    });
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
