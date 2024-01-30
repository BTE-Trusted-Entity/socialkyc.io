import type { DidUrl } from '@kiltprotocol/types';

import { Crypto } from '@kiltprotocol/utils';

import {
  DecryptRequestData,
  EncryptRequestData,
} from '@kiltprotocol/extension-api/types';

import { keypairsPromise } from './keypairs';
import { fullDidPromise } from './fullDid';

export async function encrypt({ data, peerPublicKey }: EncryptRequestData) {
  const { keyAgreement } = await keypairsPromise;
  const { keyAgreementKey, fullDid } = await fullDidPromise;

  const { box, nonce } = Crypto.encryptAsymmetric(
    data,
    peerPublicKey,
    keyAgreement.secretKey,
  );

  return {
    data: box,
    nonce,
    keyUri: `${fullDid.id}${keyAgreementKey}` as DidUrl,
  };
}

export async function decrypt({
  data,
  nonce,
  peerPublicKey,
}: DecryptRequestData) {
  const { keyAgreement } = await keypairsPromise;

  const decrypted = Crypto.decryptAsymmetric(
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
