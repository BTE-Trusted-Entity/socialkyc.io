import type {
  DidDocument,
  DidUrl,
  ICType,
  VerificationMethod,
} from '@kiltprotocol/types';

import { DidResolver, connect, disconnect } from '@kiltprotocol/sdk-js';
import { Crypto } from '@kiltprotocol/utils';
import { CType } from '@kiltprotocol/credentials';
import {
  createLightDidDocument,
  isFailedDereferenceMetadata,
  multibaseKeyToDidKey,
} from '@kiltprotocol/did';

import { randomAsNumber } from '@polkadot/util-crypto';

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

export type Challenge = {
  encryptionKeyUri: DidUrl;
  encryptedChallenge: string;
  nonce: string;
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

function getDidEncryptionKey(document: DidDocument) {
  const { keyAgreement } = document;
  if (!keyAgreement?.[0]) {
    throw new Error('encryptionKey is not defined somehow');
  }
  return keyAgreement[0];
}

export function createDid() {
  const authentication = Crypto.makeKeypairFromSeed();
  const keyAgreement = Crypto.makeEncryptionKeypairFromSeed();

  const document = createLightDidDocument({
    authentication: [authentication],
    keyAgreement: [keyAgreement],
  });
  const fragment = getDidEncryptionKey(document);
  const keyAgreementKeyUri = `${document.id}${fragment}` as DidUrl;

  return {
    document,
    keyAgreement,
    keyAgreementKeyUri,
  };
}

async function produceEncryptedChallenge(
  challenge: string,
  receiverKeyUri: DidUrl,
): Promise<Challenge> {
  const temporaryChannelDid = createDid();
  const { keyAgreementKeyUri, keyAgreement } = temporaryChannelDid;

  const { dereferencingMetadata, contentStream } =
    await DidResolver.dereference(receiverKeyUri, {});

  if (isFailedDereferenceMetadata(dereferencingMetadata)) {
    throw new Error(dereferencingMetadata.error);
  }

  const verificationMethod = contentStream as VerificationMethod;
  const { publicKey } = multibaseKeyToDidKey(
    verificationMethod.publicKeyMultibase,
  );

  const { nonce, box } = Crypto.encryptAsymmetricAsStr(
    Crypto.coToUInt8(challenge),
    publicKey,
    keyAgreement.secretKey,
  );

  return {
    encryptionKeyUri: keyAgreementKeyUri,
    encryptedChallenge: box,
    nonce,
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
  await connect('wss://peregrine.kilt.io');

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

  const claim = {
    cTypeHash: CType.idToHash(emailCType.$id),
    contents: { Email: email },
  };

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
