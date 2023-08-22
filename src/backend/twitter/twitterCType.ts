import { ConfigService, CType, ICType } from '@kiltprotocol/sdk-js';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';
import { cTypeIsStored } from '../utilities/cTypeIsStored';

/** Run this function once to store the CType */
export async function testTwitterCType(): Promise<void> {
  const draft = CType.fromProperties('X', {
    Username: {
      type: 'string',
    },
  });

  if (await cTypeIsStored(draft)) {
    if (configuration.storeDidAndCTypes) {
      logger.info('X CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('X CType missing, cannot add it');
  }

  logger.warn('Storing X CType on the blockchain');

  const api = ConfigService.get('api');
  const tx = api.tx.ctype.add(CType.toChain(draft));
  await signAndSubmit(tx);

  logger.warn(draft, 'X CType');
}

// This object was logged by storeTwitterCType()
export const twitterCType: ICType = {
  $schema:
    'ipfs://bafybeiah66wbkhqbqn7idkostj2iqyan2tstc4tpqt65udlhimd7hcxjyq/',
  additionalProperties: false,
  title: 'X',
  properties: {
    Username: {
      type: 'string',
    },
  },
  type: 'object',
  $id: 'kilt:ctype:0xca31efddb0378f137b096a5084b0aa00c0bf47836127007cc61e0e3c9937889b',
};
