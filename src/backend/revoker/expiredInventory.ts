import { logger } from '../utilities/logger';
import { sleep } from '../utilities/sleep';

import { getExpiredAttestations } from './getExpiredAttestations';
import { AttestationInfo } from './scanAttestations';

/**
 * List of attestations that need to be revoked or removed.
 */
export const expiredInventory: AttestationInfo[] = [];

async function fillExpiredInventory() {
  for await (const expiredAttestation of getExpiredAttestations()) {
    expiredInventory.push(expiredAttestation);
  }
}

const SCAN_INTERVAL_MS = 60 * 60 * 1000;

export function initExpiredInventory() {
  (async () => {
    while (true) {
      await fillExpiredInventory();
      await sleep(SCAN_INTERVAL_MS);
    }
  })();
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
