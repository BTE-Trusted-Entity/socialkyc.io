import { CType, CTypeUtils } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

/** Run this function once to store the CType */
export async function testLinkedInCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'LinkedIn',
    properties: {
      'First name': {
        type: 'string',
      },
      'Last name': {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
    },
    type: 'object',
  });

  if (await CTypeUtils.verifyStored(draft)) {
    if (configuration.storeDidAndCTypes) {
      logger.info('LinkedIn CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('LinkedIn CType missing, cannot add it');
  }

  logger.warn('Storing LinkedIn CType on the blockchain');

  const tx = await draft.getStoreTx();
  await signAndSubmit(tx);

  logger.warn(draft, 'Pass this object to CType.fromCType');
}

export const linkedInCType = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'LinkedIn',
    properties: {
      'First name': {
        type: 'string',
      },
      'Last name': {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0xfcc33a596f7a459b9fcb6dcc17792c61d998ff99813fe5c92dca230ad75f1db4',
  },
  owner: null,
  hash: '0xfcc33a596f7a459b9fcb6dcc17792c61d998ff99813fe5c92dca230ad75f1db4',
});
