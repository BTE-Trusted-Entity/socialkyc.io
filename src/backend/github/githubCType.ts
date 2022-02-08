import { CType, CTypeUtils } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';

/** Run this function once to store the CType */
export async function storeGithubCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Github',
    properties: {
      Username: {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
    },
    type: 'object',
  });

  if (await CTypeUtils.verifyStored(draft)) {
    logger.info('Github CType is already on the blockchain');
    return;
  }
  logger.warn('Storing Github CType on the blockchain');

  const tx = await draft.store();
  await signAndSubmit(tx);

  logger.warn(draft, 'Pass this object to CType.fromCType');
}

// This object was logged by storeGithubCType()
export const githubCType = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Github',
    properties: {
      Username: {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0x83b480b1b7513a4ec4f78cc0c6ffae16b989909985f092f6a4c7c7d5dee55a52',
  },
  owner: null,
  hash: '0x83b480b1b7513a4ec4f78cc0c6ffae16b989909985f092f6a4c7c7d5dee55a52',
});
