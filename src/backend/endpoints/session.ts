import type { DidUrl, VerificationMethod } from '@kiltprotocol/types';

import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

import { randomAsHex } from '@polkadot/util-crypto';

import { DidResolver } from '@kiltprotocol/sdk-js';

import {
  isFailedDereferenceMetadata,
  multibaseKeyToDidKey,
} from '@kiltprotocol/did';
import { Crypto } from '@kiltprotocol/utils';

import { fullDidPromise } from '../utilities/fullDid';
import { decrypt } from '../utilities/cryptoCallbacks';
import { getBasicSession, setSession } from '../utilities/sessionStorage';

import { isDidUrl } from '../utilities/isDidUrl';

import { paths } from './paths';

const zodPayload = z.object({
  encryptionKeyUri: z.string().refine<DidUrl>(isDidUrl),
  encryptedChallenge: z.string(),
  nonce: z.string(),
});

export interface GetSessionOutput {
  dAppEncryptionKeyUri: DidUrl;
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

  const { dereferencingMetadata, contentStream } =
    await DidResolver.dereference(encryptionKeyUri, {});

  if (isFailedDereferenceMetadata(dereferencingMetadata)) {
    throw new Error(dereferencingMetadata.error);
  }

  const verificationMethod = contentStream as VerificationMethod;
  const { publicKey } = multibaseKeyToDidKey(
    verificationMethod.publicKeyMultibase,
  );

  logger.debug('Session confirmation resolved DID encryption key');

  const { data } = await decrypt({
    data: Crypto.coToUInt8(encryptedChallenge),
    nonce: Crypto.coToUInt8(nonce),
    peerPublicKey: publicKey,
    keyUri: encryptionKeyUri,
  });
  logger.debug('Session confirmation decrypted challenge');

  const decryptedChallenge = Crypto.u8aToHex(data);
  const originalChallenge = session.didChallenge;

  if (decryptedChallenge !== originalChallenge) {
    throw Boom.forbidden('Challenge signature mismatch');
  }

  setSession({
    ...session,
    did: verificationMethod.controller,
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
      const dAppEncryptionKeyUri: DidUrl = `${fullDid.id}${keyAgreementKey}`;
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
