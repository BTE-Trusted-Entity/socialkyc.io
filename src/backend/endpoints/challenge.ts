import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';
import NodeCache from 'node-cache';
import { StatusCodes } from 'http-status-codes';

import { DefaultResolver } from '@kiltprotocol/did';
import { Crypto } from '@kiltprotocol/utils';
import { KeyRelationship } from '@kiltprotocol/types';
import { randomAsHex } from '@polkadot/util-crypto';

import { configuration } from '../utilities/configuration';
import { encryptionKeystore } from '../utilities/keystores';
import { keypairsPromise } from '../utilities/keypairs';

const zodPayload = z.object({
  identity: z.string(),
  encryptedChallenge: z.string(),
  nonce: z.string(),
  key: z.string(),
});

export type Payload = z.infer<typeof zodPayload>;

const challengesCache = new NodeCache({ stdTTL: 5 * 60 });

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const payload = request.payload as Payload;
  const { identity, encryptedChallenge, nonce, key } = payload;

  const senderDetails = await DefaultResolver.resolveDoc(identity);
  if (!senderDetails) {
    throw Boom.forbidden(`Could not resolve the DID ${identity}`);
  }

  const publicKey = senderDetails.getKeys(KeyRelationship.keyAgreement).pop();
  if (!publicKey) {
    throw Boom.forbidden(`Could not get the key`);
  }

  const { keyAgreement } = await keypairsPromise;

  const { data } = await encryptionKeystore.decrypt({
    data: Crypto.coToUInt8(encryptedChallenge),
    nonce: Crypto.coToUInt8(nonce),
    publicKey: keyAgreement.publicKey,
    peerPublicKey: Crypto.coToUInt8(publicKey.publicKeyHex),
    alg: 'x25519-xsalsa20-poly1305',
  });

  const decryptedChallenge = Crypto.u8aToHex(data);
  const originalChallenge = challengesCache.get(key);

  if (decryptedChallenge !== originalChallenge) {
    throw Boom.forbidden('Challenge signature mismatch');
  }

  return h.response().code(StatusCodes.NO_CONTENT);
}

function getChallenge() {
  const key = randomAsHex(24);
  const challenge = randomAsHex(24);

  challengesCache.set(key, challenge);

  return {
    challenge,
    key,
  };
}

const path = '/challenge';

export const challenge: ServerRoute[] = [
  {
    method: 'GET',
    path,
    handler: () => ({
      did: configuration.did,
      ...getChallenge(),
    }),
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
