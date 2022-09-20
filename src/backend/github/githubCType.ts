import { CType } from '@kiltprotocol/core';
import { ConfigService } from '@kiltprotocol/config';
import { ICType } from '@kiltprotocol/types';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

/** Run this function once to store the CType */
export async function testGithubCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'GitHub',
    properties: {
      Username: {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
    },
    type: 'object',
  });

  const api = ConfigService.get('api');
  if ((await api.query.ctype.ctypes(draft.hash)).isSome) {
    if (configuration.storeDidAndCTypes) {
      logger.info('Github CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('Github CType missing, cannot add it');
  }

  logger.warn('Storing Github CType on the blockchain');

  const tx = api.tx.ctype.add(CType.toChain(draft));
  await signAndSubmit(tx);

  logger.warn(draft, 'Github CType');
}

// This object was logged by storeGithubCType()
export const githubCType: ICType = {
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'GitHub',
    properties: {
      Username: {
        type: 'string',
      },
      'User ID': {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0xad52bd7a8bd8a52e03181a99d2743e00d0a5e96fdc0182626655fcf0c0a776d0',
  },
  owner: null,
  hash: '0xad52bd7a8bd8a52e03181a99d2743e00d0a5e96fdc0182626655fcf0c0a776d0',
};
