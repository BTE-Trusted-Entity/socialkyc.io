import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

import { DefaultResolver } from '@kiltprotocol/did';
import { Crypto } from '@kiltprotocol/utils';
import { IDidDetails, KeyRelationship } from '@kiltprotocol/types';
import { randomAsHex } from '@polkadot/util-crypto';

import { configuration } from '../utilities/configuration';
import { encryptionKeystore } from '../utilities/keystores';
import { keypairsPromise } from '../utilities/keypairs';
import { getSession, setSession } from '../utilities/sessionStorage';
import { paths } from './paths';

const zodPayload = z.object({
  identity: z.string(),
  encryptedChallenge: z.string(),
  nonce: z.string(),
  sessionId: z.string(),
});

export interface GetSessionOutput {
  did: IDidDetails['did'];
  sessionId: string;
  challenge: string;
}

export type CheckSessionInput = z.infer<typeof zodPayload>;

export type CheckSessionOutput = undefined;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Session confirmation started');

  const payload = request.payload as CheckSessionInput;
  const { identity, encryptedChallenge, nonce } = payload;
  const session = getSession(payload);

  const didDocument = await DefaultResolver.resolveDoc(identity);
  if (!didDocument) {
    throw Boom.forbidden(`Could not resolve the DID ${identity}`);
  }
  logger.debug('Session confirmation resolved DID');

  const { details: senderDetails } = didDocument;

  const publicKey = senderDetails.getKeys(KeyRelationship.keyAgreement).pop();
  if (!publicKey) {
    throw Boom.forbidden(`Could not get the key`);
  }
  logger.debug('Session confirmation got public key');

  const { keyAgreement } = await keypairsPromise;

  const { data } = await encryptionKeystore.decrypt({
    data: Crypto.coToUInt8(encryptedChallenge),
    nonce: Crypto.coToUInt8(nonce),
    publicKey: keyAgreement.publicKey,
    peerPublicKey: Crypto.coToUInt8(publicKey.publicKeyHex),
    alg: 'x25519-xsalsa20-poly1305',
  });
  logger.debug('Session confirmation decrypted challenge');

  const decryptedChallenge = Crypto.u8aToHex(data);
  const originalChallenge = session.didChallenge;

  if (decryptedChallenge !== originalChallenge) {
    throw Boom.forbidden('Challenge signature mismatch');
  }

  setSession({
    ...session,
    did: identity,
    didConfirmed: true,
  });

  logger.debug('Challenge confirmation matches');
  return h.response(<CheckSessionOutput>undefined).code(StatusCodes.NO_CONTENT);
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
    handler: () =>
      ({
        did: configuration.did,
        ...startSession(),
      } as GetSessionOutput),
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
