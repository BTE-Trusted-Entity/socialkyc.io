import { AttestationInfo } from './scanAttestations';
import { removeFromExpiredInventory } from './expiredInventory';
import {
  bulkQueryRevoked,
  shouldBeRemoved,
  shouldBeRevoked,
} from './stateIdentifiers';

/**
 * Checks if the attestation were successfully revoked or removed.
 *
 * @param attestationsInfo Array of AttestationInfo of the attestations that should have been processed.
 * @returns
 */
export async function updateExpiredInventory(
  attestationsInfo: AttestationInfo[],
) {
  const claimHashes = attestationsInfo.map(({ claimHash }) => claimHash);
  const allRevoked = await bulkQueryRevoked(claimHashes);

  for (const [index, attestation] of attestationsInfo.entries()) {
    const revoked = allRevoked[index];

    const removedSuccessfully =
      shouldBeRemoved(attestation) && revoked === null;
    const revokedSuccessfully =
      shouldBeRevoked(attestation) && revoked === true;

    if (removedSuccessfully || revokedSuccessfully) {
      removeFromExpiredInventory([attestation]);
    }
  }
}
