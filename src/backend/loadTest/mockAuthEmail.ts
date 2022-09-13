import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { z } from 'zod';

import { IClaim } from '@kiltprotocol/types';

import { getSessionBySecret, setSession } from '../utilities/sessionStorage';
import { startAttestation } from '../utilities/attestClaim';

import { paths } from '../endpoints/paths';

import { emailCType } from '../email/emailCType';

const zodParams = z.object({
  state: z.string(),
});

export type Output = { claim: IClaim };

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;

  const secret = zodParams.parse(request.query).state;

  const session = getSessionBySecret(secret);
  const { requestForAttestation } = session;
  if (!requestForAttestation) {
    throw new Error('requestForAttestation not found');
  }
  if (requestForAttestation.claim.cTypeHash !== emailCType.hash) {
    throw new Error('requestForAttestation cType mismatch');
  }

  const confirmedSession = { ...session, confirmed: true };
  setSession(confirmedSession);

  const attestationPromise = startAttestation(confirmedSession, logger);
  attestationPromise.catch((error) => logger.error(error));

  logger.debug('Email attestation started');
  return h.response({ claim: requestForAttestation.claim } as Output);
}

export const authEmail: ServerRoute = {
  method: 'GET',
  path: paths.test.redirect,
  handler,
};
