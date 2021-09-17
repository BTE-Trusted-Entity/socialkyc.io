import { naclOpen, naclSeal } from '@polkadot/util-crypto';
import { KeystoreSigner, NaclBoxCapable } from '@kiltprotocol/types';

import { keypairsPromise } from './keypairs';

export const authenticationKeystore: KeystoreSigner = {
  async sign({ data, alg }) {
    const { authentication } = await keypairsPromise;

    return {
      data: authentication.sign(data, { withType: false }),
      alg,
    };
  },
};

export const assertionKeystore: KeystoreSigner = {
  async sign({ data, alg }) {
    const { assertion } = await keypairsPromise;

    return {
      data: assertion.sign(data, { withType: false }),
      alg,
    };
  },
};

export const encryptionKeystore: Pick<NaclBoxCapable, 'encrypt' | 'decrypt'> = {
  async encrypt({ data, alg, peerPublicKey }) {
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
  },
  async decrypt({ data, alg, nonce, peerPublicKey }) {
    const { keyAgreement } = await keypairsPromise;

    const decrypted = naclOpen(
      data,
      nonce,
      keyAgreement.secretKey,
      peerPublicKey,
    );
    if (!decrypted) {
      throw new Error('failed to decrypt with given key');
    }

    return {
      data: decrypted,
      alg,
    };
  },
};
