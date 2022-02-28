import { CType, CTypeUtils } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

/** Run this function once to store the CType */
export async function testDiscordCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Discord',
    properties: {
      Username: {
        type: 'string',
      },
      Discriminator: {
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
      logger.info('Discord CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('Discord CType missing, cannot add it');
  }

  logger.warn('Storing Discord CType on the blockchain');

  const tx = await draft.store();
  await signAndSubmit(tx);

  logger.warn(draft, 'Pass this object to CType.fromCType');
}

// This object was logged by storeDiscordCType()
export const discordCType = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Discord',
    properties: {
      Username: {
        type: 'string',
      },
      Discriminator: {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0xd8c61a235204cb9e3c6acb1898d78880488846a7247d325b833243b46d923abe',
  },
  owner: null,
  hash: '0xd8c61a235204cb9e3c6acb1898d78880488846a7247d325b833243b46d923abe',
});
