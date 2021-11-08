import { IEncryptedMessage } from '@kiltprotocol/types';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import { getRequestForAttestation } from '../utilities/requestCache';
import { attestClaim } from '../utilities/attestClaim';
import { paths } from '../endpoints/paths';

const zodPayload = z.object({
  key: z.string(),
  did: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Email attestation started');

  const { key, did } = request.payload as Input;

  const requestForAttestation = getRequestForAttestation(key);
  logger.debug('Email attestation found request');

  try {
    const response = await attestClaim(requestForAttestation, did);
    logger.debug('Email attestation completed');
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
