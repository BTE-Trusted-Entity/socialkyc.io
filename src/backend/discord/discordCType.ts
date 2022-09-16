import { CType } from '@kiltprotocol/core';
import { ConfigService } from '@kiltprotocol/config';
import { ICType } from '@kiltprotocol/types';

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

  if (await CType.verifyStored(draft)) {
    if (configuration.storeDidAndCTypes) {
      logger.info('Discord CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('Discord CType missing, cannot add it');
  }

  logger.warn('Storing Discord CType on the blockchain');

  const api = ConfigService.get('api');
  const tx = api.tx.ctype.add(CType.toChain(draft));
  await signAndSubmit(tx);

  logger.warn(draft, 'Discord CType');
}

// This object was logged by storeDiscordCType()
export const discordCType: ICType = {
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
};
