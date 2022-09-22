import {
  cryptoWaitReady,
  naclSeal,
  randomAsNumber,
} from '@polkadot/util-crypto';
import { Crypto } from '@kiltprotocol/utils';

import { DidResourceUri } from '@kiltprotocol/types';

import { Claim, CType, init } from '@kiltprotocol/core';

import { HexString } from '@polkadot/util/types';

import { getEncryptedMessage } from './encryptedMessage.js';
import { getMessageEncryption } from './getMessageEncryption.js';
import {
  attestEmailApi,
  requestAttestationApi,
  authEmailApi,
  checkSession,
  getSessionFromEndpoint,
  quoteEmailApi,
  getSecretApi,
  confirmEmailApi,
} from './apis.js';

export type CheckSessionInput = {
  encryptionKeyUri: DidResourceUri;
  encryptedChallenge: HexString;
  nonce: HexString;
};

const emailCType = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Email',
    properties: {
      Email: {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
  },
  owner: null,
  hash: '0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
});

async function produceEncryptedChallenge(
  challenge: string,
  dAppEncryptionKeyUri: DidResourceUri,
): Promise<CheckSessionInput> {
  const encryption = await getMessageEncryption(dAppEncryptionKeyUri);

  const { dAppEncryptionDidKey, sporranEncryptionDidKeyUri } = encryption;

  const { sealed, nonce } = naclSeal(
    Crypto.coToUInt8(challenge),
    encryption.encryptionKey.secretKey,
    dAppEncryptionDidKey.publicKey,
  );

  return {
    encryptionKeyUri: sporranEncryptionDidKeyUri,
    encryptedChallenge: Crypto.u8aToHex(sealed),
    nonce: Crypto.u8aToHex(nonce),
  };
}

async function createSession() {
  const { challenge, dAppEncryptionKeyUri, sessionId } =
    await getSessionFromEndpoint();

  const encryptionChallenge = await produceEncryptedChallenge(
    challenge,
    dAppEncryptionKeyUri,
  );

  await checkSession(encryptionChallenge, sessionId);

  console.log('New Session started');

  return { sessionId, dAppEncryptionKeyUri };
}

(async () => {
  await init({ address: 'wss://peregrine.kilt.io/parachain-public-ws' });
  await cryptoWaitReady();

  const { sessionId, dAppEncryptionKeyUri } = await createSession();

  const email = `${randomAsNumber()}@example.com`;

  await quoteEmailApi({ email }, sessionId);

  console.log('Email quote created');

  const sporranDid =
    'did:kilt:4qsQ5sRVhbti5k9QU1Z1Wg932MwFboCmAdbSyR6GpavMkrr3';

  const claim = Claim.fromCTypeAndClaimContents(
    emailCType,
    { Email: email },
    sporranDid,
  );

  const dAppDid = dAppEncryptionKeyUri.split('#')[0];

  const encryptedMessage = await getEncryptedMessage(claim, dAppDid);

  await requestAttestationApi(
    { message: encryptedMessage, wallet: 'sporran' },
    sessionId,
  );

  console.log('Email request attestation message sent');

  const { secret } = await getSecretApi({}, sessionId);

  console.log('Successfully got secret');

  await authEmailApi(secret);

  console.log('Email auth completed');

  const { sessionId: redirectSessionId } = await createSession();

  await confirmEmailApi({ secret }, redirectSessionId);

  console.log('Session data migration completed');

  await attestEmailApi({}, redirectSessionId);

  console.log('Email Attestation test completed');

  return 'Success';
})();
