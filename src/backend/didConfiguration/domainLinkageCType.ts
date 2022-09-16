import { CType } from '@kiltprotocol/core';
import { ConfigService } from '@kiltprotocol/config';
import { ICType } from '@kiltprotocol/types';

import { signAndSubmit } from '../utilities/signAndSubmit';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';
import { cTypeIsStored } from '../utilities/cTypeIsStored';

/** Run this function once to store the CType */
export async function testDomainLinkageCType(): Promise<void> {
  const draft = CType.fromProperties('Domain Linkage Credential', {
    id: {
      type: 'string',
    },
    origin: {
      type: 'string',
    },
  });

  if (await cTypeIsStored(draft)) {
    if (configuration.storeDidAndCTypes) {
      logger.info('Domain Linkage CType is already on the blockchain');
    }
    return;
  }

  if (!configuration.storeDidAndCTypes) {
    throw new Error('Domain Linkage CType missing, cannot add it');
  }

  logger.warn('Storing Domain Linkage CType on the blockchain');

  const api = ConfigService.get('api');
  const tx = api.tx.ctype.add(CType.toChain(draft));
  await signAndSubmit(tx);

  logger.warn(draft, 'Domain linkage CType');
}

// This object was logged by storeDomainLinkageCType()
export const domainLinkageCType: ICType = {
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
};
