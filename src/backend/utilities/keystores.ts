import { naclOpen, naclSeal } from '@polkadot/util-crypto';
import {
  SignCallback,
  EncryptCallback,
  DecryptCallback,
} from '@kiltprotocol/types';

import { keypairsPromise } from './keypairs';

export const authenticationSigner: SignCallback = async ({ data, alg }) => {
  const { authentication } = await keypairsPromise;

  return {
    data: authentication.sign(data, { withType: false }),
    alg,
  };
};

export const assertionSigner: SignCallback = async ({ data, alg }) => {
  const { assertion } = await keypairsPromise;

  return {
    data: assertion.sign(data, { withType: false }),
    alg,
  };
};

export const encryptCallback: EncryptCallback = async ({
  data,
  alg,
  peerPublicKey,
}) => {
  const { keyAgreement } = await keypairsPromise;

  const { sealed, nonce } = naclSeal(
    data,
    keyAgreement.secretKey,
    peerPublicKey,
  );

  return {
    data: sealed,
    alg,
    nonce,
  };
};
export const decryptCallback: DecryptCallback = async ({
  data,
  alg,
  nonce,
  peerPublicKey,
}) => {
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
    alg,
  };
};
