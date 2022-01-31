import { CType, CTypeUtils } from '@kiltprotocol/core';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';

/** Run this function once to store the CType */
export async function storeDomainLinkageCType(): Promise<void> {
  const draft = CType.fromSchema({
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Domain Linkage Credential',
    properties: {
      id: {
        type: 'string',
      },
      origin: {
        type: 'string',
      },
    },
    type: 'object',
  });

  if (await CTypeUtils.verifyStored(draft)) {
    logger.info('Domain Linkage CType is already on the blockchain');
    return;
  }
  logger.warn('Storing Domain Linkage CType on the blockchain');

  const tx = await draft.store();
  await signAndSubmit(tx);

  logger.warn('Pass this object to CType.fromCType', draft);
}

// This object was logged by storeDomainLinkageCType()
export const domainLinkageCType = CType.fromCType({
  schema: {
    $schema: 'http://kilt-protocol.org/draft-01/ctype#',
    title: 'Domain Linkage Credential',
    properties: {
      id: {
        type: 'string',
      },
      origin: {
        type: 'string',
      },
    },
    type: 'object',
    $id: 'kilt:ctype:0x9d271c790775ee831352291f01c5d04c7979713a5896dcf5e81708184cc5c643',
  },
  owner: null,
  hash: '0x9d271c790775ee831352291f01c5d04c7979713a5896dcf5e81708184cc5c643',
});
