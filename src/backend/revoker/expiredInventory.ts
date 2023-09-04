import { logger } from '../utilities/logger';

import { expiredCredentialsGetter } from './getExpiredCredentials';
import { AttestationInfo } from './scanAttestations';

/**
 * List of attestations that need to be revoked or removed.
 *
 */
export const expiredInventory: AttestationInfo[] = [];

export async function fillExpiredInventory(fromBlock: number) {
  const transactionGenerator = expiredCredentialsGetter(fromBlock);

  for await (const transactionToSubmit of transactionGenerator) {
    expiredInventory.push(transactionToSubmit);
  }
}

export function removeFromExpiredInventory(
  processedAttestations: AttestationInfo[],
) {
  for (const attestation of processedAttestations) {
    const inventoryIndex = expiredInventory.indexOf(attestation);

    // if already removed from the inventory
    if (inventoryIndex < 0) {
      continue;
    }

    expiredInventory.splice(inventoryIndex, 1);
    logger.trace(
      `\`AttestationInfo\` removed from the \`ExpiredInventory\`: ${attestation.claimHash}`,
    );
  }
}
