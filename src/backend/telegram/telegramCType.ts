import { ConfigService, CType, ICType } from '@kiltprotocol/sdk-js';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';
import { cTypeIsStored } from '../utilities/cTypeIsStored';

/** Run this function once to store the CType */
export async function testTelegramCType(): Promise<void> {
  const draft = CType.fromProperties(
    'Telegram',
    {
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
    'draft-01',
  );

  if (await cTypeIsStored(draft)) {
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

  logger.warn(draft, 'Telegram CType');
}

// This object was logged by storeTelegramCType()
export const telegramCType: ICType = {
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
};
