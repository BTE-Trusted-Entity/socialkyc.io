import { CType, CTypeUtils } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

/** Run this function once to store the CType */
export async function testInstagramCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Instagram',
    properties: {
      Username: {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
      'Account Type': {
        type: 'string',
      },
    },
    type: 'object',
  });

  if (await CTypeUtils.verifyStored(draft)) {
    if (configuration.storeDidAndCTypes) {
      logger.info('Instagram CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('Instagram CType missing, cannot add it');
  }

  logger.warn('Storing Instagram CType on the blockchain');

  const tx = await draft.getStoreTx();
  await signAndSubmit(tx);

  logger.warn(draft, 'Pass this object to CType.fromCType');
}

export const instagramCType = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Instagram',
    properties: {
      Username: {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
      'Account Type': {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0xa3cc696621b9fef5fc94a61078ceecadd957f18634ccff05b9030f274e376459',
  },
  owner: null,
  hash: '0xa3cc696621b9fef5fc94a61078ceecadd957f18634ccff05b9030f274e376459',
});
