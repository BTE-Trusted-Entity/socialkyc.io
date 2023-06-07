import {
  DecryptCallback,
  DidResourceUri,
  EncryptCallback,
  Utils,
} from '@kiltprotocol/sdk-js';

import { keypairsPromise } from './keypairs';
import { fullDidPromise } from './fullDid';

export async function signWithAssertionMethod({ data }: { data: Uint8Array }) {
  const { assertionMethod } = await keypairsPromise;
  const { fullDid } = await fullDidPromise;

  return {
    signature: assertionMethod.sign(data, { withType: false }),
    keyType: assertionMethod.type,
    keyUri:
      `${fullDid.uri}${fullDid.assertionMethod?.[0].id}` as DidResourceUri,
  };
}

export async function encrypt({
  data,
  peerPublicKey,
}: Parameters<EncryptCallback>[0]) {
  const { keyAgreement } = await keypairsPromise;
  const { keyAgreementKey, fullDid } = await fullDidPromise;

  const { box, nonce } = Utils.Crypto.encryptAsymmetric(
    data,
    peerPublicKey,
    keyAgreement.secretKey,
  );

  return {
    data: box,
    nonce,
    keyUri: `${fullDid.uri}${keyAgreementKey.id}` as DidResourceUri,
  };
}

export async function decrypt({
  data,
  nonce,
  peerPublicKey,
}: Parameters<DecryptCallback>[0]) {
  const { keyAgreement } = await keypairsPromise;

  const decrypted = Utils.Crypto.decryptAsymmetric(
    { box: data, nonce },
    peerPublicKey,
    keyAgreement.secretKey,
  );
  if (!decrypted) {
    throw new Error('Failed to decrypt with given key');
  }

  return {
    data: decrypted,
  };
}
