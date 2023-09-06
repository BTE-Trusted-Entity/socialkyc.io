import { AttestationInfo } from './scanAttestations';
import { removeFromExpiredInventory } from './expiredInventory';
import {
  readCurrentStates,
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
  const currentStates = await readCurrentStates(attestationsInfo);

  for (const [index, attestation] of attestationsInfo.entries()) {
    const realCurrentState = currentStates[index];

    const removedSuccessfully =
      shouldBeRemoved(attestation) && realCurrentState === 'removed';
    const revokedSuccessfully =
      shouldBeRevoked(attestation) && realCurrentState === 'revoked';

    if (removedSuccessfully || revokedSuccessfully) {
      removeFromExpiredInventory([attestation]);
    }
  }
}
