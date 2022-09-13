import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { z } from 'zod';

import { configuration } from '../utilities/configuration';

import {
  EncryptedMessageInput,
  validateEncryptedMessage,
} from '../utilities/validateEncryptedMessage';
import {
  getSecretForSession,
  getSession,
  setSession,
} from '../utilities/sessionStorage';
import { decryptRequestAttestation } from '../utilities/decryptMessage';
import { paths } from '../endpoints/paths';

export type Input = EncryptedMessageInput & z.infer<typeof zodPayload>;

export type Output = { url: URL };

const zodPayload = z.object({
  wallet: z.string(),
});

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject | string> {
  const { logger } = request;
  logger.debug('Email request attestation started');

  const session = getSession(request.headers);
  delete session.attestationPromise;

  const { requestForAttestation } = await decryptRequestAttestation(request);
  setSession({ ...session, requestForAttestation, confirmed: false });
  logger.debug('Email request attestation cached');

  const { wallet } = request.payload as Input;
  const { sessionId } = session;
  const secret = getSecretForSession(sessionId);

  const url = new URL(paths.test.redirect, configuration.baseUri);
  url.search = new URLSearchParams({ state: secret, wallet }).toString();

  return h.response({ url } as Output);
}

export const requestAttestationEmailTest: ServerRoute = {
  method: 'POST',
  path: paths.test.requestAttestation,
  handler,
  options: {
    validate: {
      payload: async (payload) =>
        zodPayload.parse(payload) && validateEncryptedMessage(payload),
    },
  },
};
