import { CType, CTypeUtils } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';

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

  if (await CTypeUtils.verifyStored(draft)) {
    console.log('Twitter CType is already on the blockchain');
    return;
  }
  console.log('Storing Twitter CType on the blockchain');

  const tx = await draft.store();
  await signAndSubmit(tx);

  console.log('Pass this object to CType.fromCType', draft);
}

// This object was logged by storeTwitterCType()
export const twitterCType = CType.fromCType({
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
