import { CType, CTypeUtils } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';

/** Run this function once to store the CType */
export async function storeGithubCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'GitHub',
    properties: {
      Login: {
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
    title: 'GitHub',
    properties: {
      Login: {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0xb91940ac5a54540cb1c3a2f246bee488c9a0bd72e4997733ba8f24f7d2525bbb',
  },
  owner: null,
  hash: '0xb91940ac5a54540cb1c3a2f246bee488c9a0bd72e4997733ba8f24f7d2525bbb',
});
