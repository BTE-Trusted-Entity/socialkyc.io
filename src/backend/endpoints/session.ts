import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

import * as Did from '@kiltprotocol/did';
import { Crypto } from '@kiltprotocol/utils';
import { DidResourceUri } from '@kiltprotocol/types';
import { randomAsHex } from '@polkadot/util-crypto';

import { fullDidPromise } from '../utilities/fullDid';
import { decrypt } from '../utilities/cryptoCallbacks';
import { getBasicSession, setSession } from '../utilities/sessionStorage';

import { isDidResourceUri } from '../utilities/isDidResourceUri';

import { paths } from './paths';

const zodPayload = z.object({
  encryptionKeyUri: z.string().refine<DidResourceUri>(isDidResourceUri),
  encryptedChallenge: z.string(),
  nonce: z.string(),
});

export interface GetSessionOutput {
  dAppEncryptionKeyUri: DidResourceUri;
  sessionId: string;
  challenge: string;
}

export type CheckSessionInput = z.infer<typeof zodPayload>;

export type CheckSessionOutput = void;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Session confirmation started');

  const payload = request.payload as CheckSessionInput;
  const { encryptionKeyUri, encryptedChallenge, nonce } = payload;
  const session = getBasicSession(request.headers);

  const encryptionKey = await Did.resolveKey(encryptionKeyUri);

  logger.debug('Session confirmation resolved DID encryption key');

  const { keyAgreementKey, fullDid } = await fullDidPromise;

  const { data } = await decrypt({
    data: Crypto.coToUInt8(encryptedChallenge),
    nonce: Crypto.coToUInt8(nonce),
    keyUri: `${fullDid.uri}${keyAgreementKey.id}`,
    peerPublicKey: encryptionKey.publicKey,
  });
  logger.debug('Session confirmation decrypted challenge');

  const decryptedChallenge = Crypto.u8aToHex(data);
  const originalChallenge = session.didChallenge;

  if (decryptedChallenge !== originalChallenge) {
    throw Boom.forbidden('Challenge signature mismatch');
  }

  setSession({
    ...session,
    did: encryptionKey.controller,
    encryptionKeyUri,
    didConfirmed: true,
  });

  logger.debug('Challenge confirmation matches');
  return h.response().code(StatusCodes.NO_CONTENT);
}

function startSession() {
  const sessionId = randomAsHex(24);
  const challenge = randomAsHex(24);

  setSession({ sessionId, didChallenge: challenge });

  return {
    challenge,
    sessionId,
  };
}

const path = paths.session;

export const session: ServerRoute[] = [
  {
    method: 'GET',
    path,
    handler: async () => {
      const { fullDid, keyAgreementKey } = await fullDidPromise;
      const dAppEncryptionKeyUri: DidResourceUri = `${fullDid.uri}${keyAgreementKey.id}`;
      return {
        dAppEncryptionKeyUri,
        ...startSession(),
      } as GetSessionOutput;
    },
  },
  {
    method: 'POST',
    path,
    handler,
    options: {
      validate: {
        payload: async (payload) => zodPayload.parse(payload),
      },
    },
  },
];
