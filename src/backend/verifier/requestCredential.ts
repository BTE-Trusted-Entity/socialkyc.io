import type { IEncryptedMessage } from '@kiltprotocol/types';
import type {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { z } from 'zod';
import { randomAsHex } from '@polkadot/util-crypto';
import { CType } from '@kiltprotocol/core';

import { supportedCTypes } from '../utilities/supportedCTypes';
import { supportedCTypeKeys } from '../utilities/supportedCType';
import { encryptMessageBody } from '../utilities/encryptMessage';
import { paths } from '../endpoints/paths';
import { getSession, setSession } from '../utilities/sessionStorage';

const zodPayload = z.object({
  cType: z.enum(supportedCTypeKeys),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = IEncryptedMessage;

async function handler(
  request: Request<{ Payload: Input }>,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Request credential started');

  const { cType } = request.payload;
  const session = getSession(request.headers);
  const { encryptionKeyUri } = session;

  const cTypeHash = CType.idToHash(supportedCTypes[cType].$id);
  logger.debug('Request credential CType found');

  const challenge = randomAsHex(24);
  setSession({ ...session, requestChallenge: challenge });
  const output = await encryptMessageBody(encryptionKeyUri, {
    content: {
      cTypes: [{ cTypeHash }],
      challenge,
    },
    type: 'request-credential',
  });

  logger.debug('Request credential completed');
  return h.response(output as Output);
}

export const requestCredential = {
  method: 'POST',
  path: paths.verifier.requestCredential,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
} as ServerRoute;
