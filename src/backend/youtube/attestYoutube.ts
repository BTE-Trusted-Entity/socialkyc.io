import { IEncryptedMessage } from '@kiltprotocol/types';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

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

  const session = getSession(request.headers);

  const response = await getAttestationMessage(session, logger);
  logger.debug('Youtube attestation completed');

  delete session.claim;
  delete session.requestForAttestation;
  delete session.confirmed;
  setSession(session);

  return h.response(response as Output);
}

export const attestYoutube: ServerRoute = {
  method: 'POST',
  path: paths.youtube.attest,
  handler,
};
