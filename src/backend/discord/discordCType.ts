import { CType, CTypeUtils } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';

/** Run this function once to store the CType */
export async function storeDiscordCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Discord',
    properties: {
      id: {
        type: 'string',
      },
      username: {
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

  logger.warn('Pass this object to CType.fromCType', draft);
}

// This object was logged by storeDiscordCType()
export const discordCType = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Discord',
    properties: {
      id: {
        type: 'string',
      },
      username: {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0x39721185561d20c767bb717a5c9f6762d512d376c4dbffc09124a8441095804d',
  },
  owner: null,
  hash: '0x39721185561d20c767bb717a5c9f6762d512d376c4dbffc09124a8441095804d',
});
