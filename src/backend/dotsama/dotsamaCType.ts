import { CType } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';

/** Run this function once to store the CType */
export async function storeDotsamaCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Dotsama',
    properties: {
      Name: {
        type: 'string',
      },
    },
    type: 'object',
  });

  const tx = await draft.store();
  await signAndSubmit(tx);

  console.log('Pass this object to CType.fromCType', draft);
}

// This object was logged by storeDotsamaCType()
export const dotsamaCType = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Dotsama',
    properties: {
      Name: {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0x55c1dd2f28ae7fc2376dda1c01bf94658fccd80d3fc6685b3a17427797e845a2',
  },
  owner: null,
  hash: '0x55c1dd2f28ae7fc2376dda1c01bf94658fccd80d3fc6685b3a17427797e845a2',
});
