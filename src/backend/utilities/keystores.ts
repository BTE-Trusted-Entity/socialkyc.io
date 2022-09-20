import { naclOpen, naclSeal } from '@polkadot/util-crypto';
import {
  SignCallback,
  EncryptCallback,
  DecryptCallback,
} from '@kiltprotocol/types';

import { keypairsPromise } from './keypairs';
import { fullDidPromise } from './fullDid';

export const authenticationSigner: SignCallback = async ({ data }) => {
  const { authentication } = await keypairsPromise;
  const { fullDid } = await fullDidPromise;

  return {
    data: authentication.sign(data, { withType: false }),
    keyUri: `${fullDid.uri}${fullDid.authentication[0].id}`,
    keyType: authentication.type,
  };
};

export const assertionSigner: SignCallback = async ({ data }) => {
  const { assertion } = await keypairsPromise;
  const { fullDid } = await fullDidPromise;

  return {
    data: assertion.sign(data, { withType: false }),
    keyUri: `${fullDid.uri}${fullDid.authentication[0].id}`,
    keyType: assertion.type,
  };
};

export const encryptCallback: EncryptCallback = async ({
  data,
  peerPublicKey,
}) => {
  const { keyAgreement } = await keypairsPromise;
  const { encryptionKey, fullDid } = await fullDidPromise;

  const { sealed, nonce } = naclSeal(
    data,
    keyAgreement.secretKey,
    peerPublicKey,
  );

  return {
    data: sealed,
    nonce,
    keyUri: `${fullDid.uri}${encryptionKey.id}`,
  };
};
export const decryptCallback: DecryptCallback = async ({
  data,
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
  };
};
