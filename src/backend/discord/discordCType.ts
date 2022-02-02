import { CType, CTypeUtils } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';

/** Run this function once to store the CType */
export async function storeDiscordCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Discord',
    properties: {
      username: {
        type: 'string',
      },
      discriminator: {
        type: 'string',
      },
      id: {
        type: 'string',
      },
    },
    type: 'object',
  });

  if (await CTypeUtils.verifyStored(draft)) {
    logger.info('Discord CType is already on the blockchain');
    return;
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
      username: {
        type: 'string',
      },
      discriminator: {
        type: 'string',
      },
      id: {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0x22f704c3e1c2160ab5cc780e75ea31285bd29e51e423726450df3150b572db0b',
  },
  owner: null,
  hash: '0x22f704c3e1c2160ab5cc780e75ea31285bd29e51e423726450df3150b572db0b',
});
