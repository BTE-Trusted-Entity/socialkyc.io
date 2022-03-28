import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { z } from 'zod';
import { IEncryptedMessage } from '@kiltprotocol/types';

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
  logger.debug('Twitter attestation started');

  const session = getSessionWithDid(request.payload as PayloadWithSession);

  const response = await getAttestationMessage(session, logger);
  delete session.requestForAttestation;
  setSession(session);

  logger.debug('Twitter attestation completed');
  return h.response(response as Output);
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
