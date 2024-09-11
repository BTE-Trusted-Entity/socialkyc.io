import { sleep } from '../utilities/sleep';
import { configuration } from '../utilities/configuration';

import { batchQueryRevoked } from './batchQueryRevoked';
import { queryExpiredAttestations } from './indexer/queryAttestations';
import { AttestationInfo } from './scanAttestations';
import { shouldBeRemoved } from './shouldBeExpired';

const SCAN_INTERVAL_MS = 60 * 60 * 1000;

export const attestationsToRevoke: AttestationInfo[] = [];
export const attestationsToRemove: AttestationInfo[] = [];
export const attestationsToRemoveLater: AttestationInfo[] = [];

/** Adds the `element` to the `list`; only if missing.
 * Avoids duplicates.
 *
 * @param list: one of the inventory lists
 * @param element: attestation from the scan
 */
function include(list: AttestationInfo[], element: AttestationInfo) {
  const isAlreadyIncluded = list.some(
    ({ claimHash }) => claimHash === element.claimHash,
  );

  if (!isAlreadyIncluded) {
    list.push(element);
  }
}

export async function fillExpiredInventory() {
  const expiredSinceLastRun = attestationsToRemoveLater.filter(shouldBeRemoved);
  attestationsToRemove.push(...expiredSinceLastRun);
  attestationsToRemoveLater.splice(0, expiredSinceLastRun.length);

  const issuedBy = configuration.did;

  if (issuedBy === 'pending') {
    return;
  }

  for await (const expiredAttestation of queryExpiredAttestations(issuedBy)) {
    if (shouldBeRemoved(expiredAttestation)) {
      include(attestationsToRemove, expiredAttestation);
    } else {
      if (expiredAttestation.revoked === false) {
        include(attestationsToRevoke, expiredAttestation);
      }
      include(attestationsToRemoveLater, expiredAttestation);
    }
  }
}

export function initExpiredInventory() {
  (async () => {
    while (true) {
      await fillExpiredInventory();
      await sleep(SCAN_INTERVAL_MS);
    }
  })();
}

function remove<Type>(list: Type[], item: Type) {
  const index = list.indexOf(item);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

export async function updateExpiredInventory(
  attestationsInfo: AttestationInfo[],
  toRevoke: boolean,
) {
  const claimHashes = attestationsInfo.map(({ claimHash }) => claimHash);
  const currentRevocationStatuses = await batchQueryRevoked(claimHashes);

  attestationsInfo.forEach((attestation) => {
    const revoked = currentRevocationStatuses[attestation.claimHash];

    if (toRevoke && revoked === true) {
      remove(attestationsToRevoke, attestation);
    }
    if (!toRevoke && revoked === null) {
      remove(attestationsToRemove, attestation);
    }
  });
}
