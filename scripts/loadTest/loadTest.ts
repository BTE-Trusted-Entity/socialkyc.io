import { naclSeal, randomAsNumber } from '@polkadot/util-crypto';
import { HexString } from '@polkadot/util/types';
import {
  Claim,
  connect,
  Did,
  DidDocument,
  DidEncryptionKey,
  DidResourceUri,
  disconnect,
  ICType,
  Utils,
} from '@kiltprotocol/sdk-js';

import { getEncryptedMessage } from './encryptedMessage.js';
import {
  attestEmailApi,
  checkSession,
  confirmEmailApi,
  getSecretApi,
  getSessionFromEndpoint,
  quoteEmailApi,
  requestAttestationApi,
  sendEmailApi,
} from './apis.js';

export type CheckSessionInput = {
  encryptionKeyUri: DidResourceUri;
  encryptedChallenge: HexString;
  nonce: HexString;
};

const emailCType: ICType = {
  $id: 'kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
  $schema: 'http://kilt-protocol.org/draft-01/ctype#',
  title: 'Email',
  properties: {
    Email: {
      type: 'string',
    },
  },
  type: 'object',
};

function getDidEncryptionKey(details: DidDocument): DidEncryptionKey {
  const { keyAgreement } = details;
  if (!keyAgreement?.[0]) {
    throw new Error('encryptionKey is not defined somehow');
  }
  return keyAgreement[0];
}

export function createDid() {
  const authentication = Utils.Crypto.makeKeypairFromSeed();
  const keyAgreement = Utils.Crypto.makeEncryptionKeypairFromSeed();

  const document = Did.createLightDidDocument({
    authentication: [authentication],
    keyAgreement: [keyAgreement],
  });
  const { id } = getDidEncryptionKey(document);
  const keyAgreementKeyUri: DidResourceUri = `${document.uri}${id}`;

  return {
    document,
    keyAgreement,
    keyAgreementKeyUri,
  };
}

async function produceEncryptedChallenge(
  challenge: string,
  dAppEncryptionKeyUri: DidResourceUri,
): Promise<CheckSessionInput> {
  const dAppEncryptionDidKey = await Did.resolveKey(dAppEncryptionKeyUri);

  const temporaryChannelDid = createDid();
  const { keyAgreementKeyUri, keyAgreement } = temporaryChannelDid;

  const { sealed, nonce } = naclSeal(
    Utils.Crypto.coToUInt8(challenge),
    keyAgreement.secretKey,
    dAppEncryptionDidKey.publicKey,
  );

  return {
    encryptionKeyUri: keyAgreementKeyUri,
    encryptedChallenge: Utils.Crypto.u8aToHex(sealed),
    nonce: Utils.Crypto.u8aToHex(nonce),
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
  await connect('wss://peregrine.kilt.io/parachain-public-ws');

  const { sessionId: firstSessionId, dAppEncryptionKeyUri } =
    await createSession();

  const email = `${randomAsNumber()}@example.com`;

  await sendEmailApi({ email, wallet: 'load' }, firstSessionId);

  console.log('Send email completed');

  const { secret } = await getSecretApi({}, firstSessionId);

  console.log('Successfully got secret');

  const { sessionId } = await createSession();

  await confirmEmailApi({ secret }, sessionId);

  console.log('Session data migration completed');

  await quoteEmailApi({ email }, sessionId);

  console.log('Email quote created');

  const sporran = createDid();

  const claim = Claim.fromCTypeAndClaimContents(
    emailCType,
    { Email: email },
    sporran.document.uri,
  );

  const encryptedMessage = await getEncryptedMessage(
    claim,
    dAppEncryptionKeyUri,
    sporran.keyAgreementKeyUri,
    sporran.keyAgreement,
  );

  await requestAttestationApi(
    { message: encryptedMessage, wallet: 'sporran' },
    sessionId,
  );

  console.log('Email request attestation message sent');

  await attestEmailApi({}, sessionId);

  console.log('Email Attestation test completed');

  await disconnect();

  return 'Success';
})();
