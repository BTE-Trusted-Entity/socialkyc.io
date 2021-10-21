import { CType } from '@kiltprotocol/core';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';

import { fullDidPromise } from '../utilities/fullDid';
import { keypairsPromise } from '../utilities/keypairs';
import { assertionKeystore } from '../utilities/keystores';

/** Run this function once to store the CType */
export async function storeTwitterCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Twitter',
    properties: {
      Twitter: {
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
export const twitter = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Twitter',
    properties: {
      Twitter: {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420',
  },
  owner: null,
  hash: '0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420',
});
