import { IEncryptedMessage } from '@kiltprotocol/types';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import {
  getSessionWithDid,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';
import { attestClaim } from '../utilities/attestClaim';
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
  logger.debug('Email attestation started');

  const session = getSessionWithDid(request.payload as PayloadWithSession);
  const { did, requestForAttestation, confirmed } = session;
  if (!requestForAttestation || !confirmed) {
    throw Boom.notFound('Confirmed requestForAttestation not found');
  }

  try {
    const attestedMessagePromise =
      session.attestedMessagePromise || attestClaim(requestForAttestation, did);
    setSession({ ...session, attestedMessagePromise });

    const response = await attestedMessagePromise;
    logger.debug('Email attestation completed');

    delete session.requestForAttestation;
    setSession(session);

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
