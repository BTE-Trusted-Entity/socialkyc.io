import { ConfigService, CType, ICType } from '@kiltprotocol/sdk-js';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';
import { cTypeIsStored } from '../utilities/cTypeIsStored';

/** Run this function once to store the CType */
export async function testTwitchCType(): Promise<void> {
  const draft = CType.fromProperties(
    'Twitch',
    {
      Username: {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
    },
    'draft-01',
  );

  if (await cTypeIsStored(draft)) {
    if (configuration.storeDidAndCTypes) {
      logger.info('Twitch CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('Twitch CType missing, cannot add it');
  }

  logger.warn('Storing Twitch CType on the blockchain');

  const api = ConfigService.get('api');
  const tx = api.tx.ctype.add(CType.toChain(draft));
  await signAndSubmit(tx);

  logger.warn(draft, 'Twitch CType');
}

// This object was logged by storeTwitchCType()
export const twitchCType: ICType = {
  $schema: 'http://kilt-protocol.org/draft-01/ctype#',
  title: 'Twitch',
  properties: {
    Username: {
      type: 'string',
    },
    'User ID': {
      type: 'string',
    },
  },
  type: 'object',
  $id: 'kilt:ctype:0x568ec5ffd7771c4677a5470771adcdea1ea4d6b566f060dc419ff133a0089d80',
};
