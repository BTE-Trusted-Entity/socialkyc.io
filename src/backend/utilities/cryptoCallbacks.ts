import { naclOpen, naclSeal } from '@polkadot/util-crypto';
import {
  DecryptCallback,
  DidResourceUri,
  EncryptCallback,
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

  const { sealed, nonce } = naclSeal(
    data,
    keyAgreement.secretKey,
    peerPublicKey,
  );

  return {
    data: sealed,
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

  const decrypted = naclOpen(
    data,
    nonce,
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
