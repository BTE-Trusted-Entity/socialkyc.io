import { CType } from '@kiltprotocol/core';
import { ConfigService } from '@kiltprotocol/config';
import { ICType } from '@kiltprotocol/types';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

/** Run this function once to store the CType */
export async function testTelegramCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Telegram',
    properties: {
      'First name': {
        type: 'string',
      },
      'Last name': {
        type: 'string',
      },
      Username: {
        type: 'string',
      },
      'User ID': {
        type: 'number',
      },
    },
    type: 'object',
  });

  if (await CType.verifyStored(draft)) {
    if (configuration.storeDidAndCTypes) {
      logger.info('Telegram CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('Telegram CType missing, cannot add it');
  }

  logger.warn('Storing Telegram CType on the blockchain');

  const api = ConfigService.get('api');
  const tx = api.tx.ctype.add(CType.toChain(draft));
  await signAndSubmit(tx);

  logger.warn(draft, 'Pass this object to CType.fromCType');
}

// This object was logged by storeTelegramCType()
export const telegramCType: ICType = {
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Telegram',
    properties: {
      'First name': {
        type: 'string',
      },
      'Last name': {
        type: 'string',
      },
      Username: {
        type: 'string',
      },
      'User ID': {
        type: 'number',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0xcef8f3fe5aa7379faea95327942fd77287e1c144e3f53243e55705f11e890a4c',
  },
  owner: null,
  hash: '0xcef8f3fe5aa7379faea95327942fd77287e1c144e3f53243e55705f11e890a4c',
};
