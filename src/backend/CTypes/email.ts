import { CType } from '@kiltprotocol/core';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';

import { fullDidPromise } from '../utilities/fullDid';
import { keypairsPromise } from '../utilities/keypairs';
import { assertionKeystore } from '../utilities/keystores';

/** Run this function once to store the CType */
export async function storeEmailCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Email',
    properties: {
      Email: {
        type: 'string',
      },
    },
    type: 'object',
  });

  const tx = await draft.store();

  const { fullDid } = await fullDidPromise;
  const { identity } = await keypairsPromise;
  const extrinsic = await fullDid.authorizeExtrinsic(
    tx,
    assertionKeystore,
    identity.address,
  );

  await BlockchainUtils.signAndSubmitTx(extrinsic, identity);

  console.log('Pass this object to CType.fromCType', draft);
}

// This object was logged by storeEmailCType()
export const email = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Email',
    properties: {
      Email: {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
  },
  owner: null,
  hash: '0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac',
});
