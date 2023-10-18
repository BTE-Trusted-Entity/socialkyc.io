import { sleep } from '../utilities/sleep';

import { getExpiredAttestations } from './getExpiredAttestations';
import { AttestationInfo } from './scanAttestations';
import { shouldBeRemoved } from './shouldBeExpired';
import { batchQueryRevoked } from './batchQueryRevoked';

export const attestationsToRevoke: AttestationInfo[] = [];
export const attestationsToRemove: AttestationInfo[] = [];
export const attestationsToRemoveLater: AttestationInfo[] = [];

export async function fillExpiredInventory() {
  const expiredSinceLastRun = attestationsToRemoveLater.filter(shouldBeRemoved);
  attestationsToRemove.push(...expiredSinceLastRun);
  attestationsToRemoveLater.splice(0, expiredSinceLastRun.length);

  for await (const expiredAttestation of getExpiredAttestations()) {
    if (shouldBeRemoved(expiredAttestation)) {
      attestationsToRemove.push(expiredAttestation);
    } else {
      if (expiredAttestation.revoked === false) {
        attestationsToRevoke.push(expiredAttestation);
      }
      attestationsToRemoveLater.push(expiredAttestation);
    }
  }
}

const SCAN_INTERVAL_MS = 24 * 60 * 60 * 1000;

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
