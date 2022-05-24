import { Request, ServerRoute } from '@hapi/hapi';

import {
  getSecretForSession,
  getSession,
  setSession,
} from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { decryptRequestAttestation } from '../utilities/decryptMessage';
import { makeControlledPromise } from '../utilities/makeControlledPromise';
import { paths } from '../endpoints/paths';

import { tweetsListeners } from './tweets';

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('Twitter request attestation started');

  const session = getSession(request.headers);
  delete session.attestationPromise;

  const { requestForAttestation } = await decryptRequestAttestation(request);
  setSession({ ...session, requestForAttestation, confirmed: false });
  logger.debug('Twitter request attestation cached');

  const secret = getSecretForSession(session.sessionId);
  const username = requestForAttestation.claim.contents['Twitter'] as string;

  const confirmation = makeControlledPromise<void>();
  confirmation.promise.catch((error) => logger.error(error));
  tweetsListeners.set(username.toLowerCase(), [secret, confirmation]);
  logger.debug('Twitter request attestation listener added');

  return secret as Output;
}

export const requestTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.requestAttestation,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
