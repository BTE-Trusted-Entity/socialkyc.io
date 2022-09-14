import { ServerRoute } from '@hapi/hapi';
import { naclSeal } from '@polkadot/util-crypto';
import { Crypto } from '@kiltprotocol/utils';

import { DidResourceUri } from '@kiltprotocol/types';

import { Claim } from '@kiltprotocol/core';

import { HexString } from '@polkadot/util/types';

import { emailCType } from '../email/emailCType';

import { paths } from '../endpoints/paths';

import { getEncryptedMessage } from './encryptedMessage';
import { getMessageEncryption } from './getMessageEncryption';
import { quoteEmailApi } from './quoteEmailApi';
import { checkSession, getSessionFromEndpoint } from './sessionApi';
import { requestAttestationApi } from './requestAttestationApi';
import { authEmailApi } from './mockAuthEmaiApi';
import { attestEmailApi } from './attestationEmailApi';
import { confirmEmailApi } from './confirmEmailApi';
import { getSecretApi } from './getSecretApi';

export type CheckSessionInput = {
  encryptionKeyUri: DidResourceUri;
  encryptedChallenge: HexString;
  nonce: HexString;
};

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

  return sessionId;
}

const generateRandomEmail = () =>
  Math.round(Math.random() * 100000) + '@email.com';

async function performTest() {
  const sessionId = await createSession();
  const email = generateRandomEmail();

  await quoteEmailApi({ email }, sessionId);

  const identityDid =
    'did:kilt:4qsQ5sRVhbti5k9QU1Z1Wg932MwFboCmAdbSyR6GpavMkrr3';

  const claim = Claim.fromCTypeAndClaimContents(
    emailCType,
    { Email: email.trim() },
    identityDid,
  );

  const encryptedMessage = await getEncryptedMessage(claim);

  await requestAttestationApi(
    { message: encryptedMessage, wallet: 'sporran' },
    sessionId,
  );

  // Substitutes the manual step of the user clicking the email confirmation link
  const { secret } = await getSecretApi({}, sessionId);

  await authEmailApi(secret);

  const redirectSessionId = await createSession();

  await confirmEmailApi({ secret }, redirectSessionId);
  await attestEmailApi({}, redirectSessionId);

  return 'Success';
}

export const loadTest: ServerRoute = {
  method: 'GET',
  path: paths.test.loadTest,
  handler: () => performTest(),
};
