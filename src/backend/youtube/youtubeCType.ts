import { ConfigService, CType, ICType } from '@kiltprotocol/sdk-js';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';
import { cTypeIsStored } from '../utilities/cTypeIsStored';

/** Run this function once to store the CType */
export async function testYoutubeCType(): Promise<void> {
  const draft = CType.fromProperties(
    'YoutubeChannel',
    {
      'Channel Name': {
        type: 'string',
      },
      'Channel ID': {
        type: 'string',
      },
    },
    'draft-01',
  );

  if (await cTypeIsStored(draft)) {
    if (configuration.storeDidAndCTypes) {
      logger.info('Youtube CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('Youtube CType missing, cannot add it');
  }

  logger.warn('Storing Youtube CType on the blockchain');

  const api = ConfigService.get('api');
  const tx = api.tx.ctype.add(CType.toChain(draft));
  await signAndSubmit(tx);

  logger.warn(draft, 'YouTube CType');
}

// This object was logged by testYoutubeCType()
export const youtubeCType: ICType = {
  $schema: 'http://kilt-protocol.org/draft-01/ctype#',
  title: 'YoutubeChannel',
  properties: {
    'Channel Name': {
      type: 'string',
    },
    'Channel ID': {
      type: 'string',
    },
  },
  type: 'object',
  $id: 'kilt:ctype:0x329a2a5861ea63c250763e5e4c4d4a18fe4470a31e541365c7fb831e5432b940',
};
