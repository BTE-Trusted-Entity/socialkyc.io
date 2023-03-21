import { IEncryptedMessage } from '@kiltprotocol/sdk-js';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { getSession, setSession } from '../utilities/sessionStorage';
import { getAttestationMessage } from '../utilities/attestClaim';

import { paths } from './paths';

export type Input = Record<string, never>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;

  const session = getSession(request.headers);

  const response = await getAttestationMessage(session, logger);
  logger.debug(`Attestation completed for ${session.claim?.cTypeHash}`);

  delete session.claim;
  delete session.credential;
  delete session.confirmed;
  setSession(session);

  return h.response(response as Output);
}

export const attest: ServerRoute = {
  method: 'POST',
  path: paths.attest,
  handler,
};
