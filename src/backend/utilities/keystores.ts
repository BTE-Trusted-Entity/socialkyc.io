import { KeystoreSigner } from '@kiltprotocol/types';

import { keypairsPromise } from './keypairs';

export const authenticationKeystore: KeystoreSigner = {
  sign: async ({ data, alg }) => {
    const { authentication } = await keypairsPromise;

    return {
      data: authentication.sign(data, { withType: false }),
      alg,
    };
  },
};

export const assertionKeystore: KeystoreSigner = {
  sign: async ({ data, alg }) => {
    const { assertion } = await keypairsPromise;

    return {
      data: assertion.sign(data, { withType: false }),
      alg,
    };
  },
};
