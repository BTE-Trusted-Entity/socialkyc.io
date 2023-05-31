import { ConfigService, CType, ICType } from '@kiltprotocol/sdk-js';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';
import { cTypeIsStored } from '../utilities/cTypeIsStored';

/** Run this function once to store the CType */
export async function testTwitterCType(): Promise<void> {
  const draft = CType.fromProperties(
    'Twitter',
    {
      Twitter: {
        type: 'string',
      },
    },
    'draft-01',
  );

  if (await cTypeIsStored(draft)) {
    if (configuration.storeDidAndCTypes) {
      logger.info('Twitter CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('Twitter CType missing, cannot add it');
  }

  logger.warn('Storing Twitter CType on the blockchain');

  const api = ConfigService.get('api');
  const tx = api.tx.ctype.add(CType.toChain(draft));
  await signAndSubmit(tx);

  logger.warn(draft, 'Twitter CType');
}

// This object was logged by storeTwitterCType()
export const twitterCType: ICType = {
  $schema: 'http://kilt-protocol.org/draft-01/ctype#',
  title: 'Twitter',
  properties: {
    Twitter: {
      type: 'string',
    },
  },
  type: 'object',
  $id: 'kilt:ctype:0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420',
};
