import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { getSession, setSession } from '../utilities/sessionStorage';
import { getAttestationMessage } from '../utilities/attestClaim';
import { paths } from '../endpoints/paths';

export type Input = Record<string, never>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter attestation started');

  const session = getSession(request.headers);

  const response = await getAttestationMessage(session, logger);
  delete session.requestForAttestation;
  setSession(session);

  logger.debug('Twitter attestation completed');
  return h.response(response as Output);
}

export const attestTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.attest,
  handler,
};
