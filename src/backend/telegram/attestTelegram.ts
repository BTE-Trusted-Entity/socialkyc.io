import { IEncryptedMessage } from '@kiltprotocol/types';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { z } from 'zod';

import {
  getSessionWithDid,
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

  const session = getSessionWithDid(request.payload as PayloadWithSession);

  const response = await getAttestationMessage(session, logger);
  logger.debug('Telegram attestation completed');

  delete session.claim;
  delete session.requestForAttestation;
  delete session.confirmed;
  setSession(session);

  return h.response(response as Output);
}

export const attestTelegram: ServerRoute = {
  method: 'POST',
  path: paths.telegram.attest,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
