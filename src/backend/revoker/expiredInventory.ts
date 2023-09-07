import { sleep } from '../utilities/sleep';

import { getExpiredAttestations } from './getExpiredAttestations';
import { AttestationInfo } from './scanAttestations';
import { batchQueryRevoked, shouldBeRemoved } from './stateIdentifiers';

export const attestationsToRevoke: AttestationInfo[] = [];
export const attestationsToRemove: AttestationInfo[] = [];
export const attestationsToRemoveLater: AttestationInfo[] = [];

async function fillExpiredInventory() {
  const expiredSinceLastRun = attestationsToRemoveLater.filter(shouldBeRemoved);
  attestationsToRemove.push(...expiredSinceLastRun);
  attestationsToRemoveLater.splice(0, expiredSinceLastRun.length);

  for await (const expiredAttestation of getExpiredAttestations()) {
    if (shouldBeRemoved(expiredAttestation)) {
      attestationsToRemove.push(expiredAttestation);
    } else {
      attestationsToRevoke.push(expiredAttestation);
      attestationsToRemoveLater.push(expiredAttestation);
    }
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

function remove<Type>(list: Type[], item: Type) {
  const index = list.indexOf(item);
  if (index >= 0) {
    list.splice(index, 1);
  }
}

export async function updateExpiredInventory(
  attestationsInfo: AttestationInfo[],
  revoke: boolean,
) {
  const claimHashes = attestationsInfo.map(({ claimHash }) => claimHash);
  const allRevoked = await batchQueryRevoked(claimHashes);

  attestationsInfo.forEach((attestation) => {
    const revoked = allRevoked[attestation.claimHash];

    if (revoke && revoked === true) {
      remove(attestationsToRevoke, attestation);
    }
    if (!revoke && revoked === null) {
      remove(attestationsToRemove, attestation);
    }
  });
}
