import { AttestationInfo } from './scanAttestations';
import { removeFromExpiredInventory } from './expiredInventory';
import { deduceWishedState, readCurrentState } from './getExpiredCredentials';

/**
 * Checks if the attestation were successfully revoked or removed.
 *
 * @param attestationsInfo Array of AttestationInfo of the credentials that should have been processed.
 * @returns
 */
export async function updateExpiredInventory(
  attestationsInfo: AttestationInfo[],
) {
  for (const attestation of attestationsInfo) {
    const stateWishedAfterProcess = deduceWishedState(attestation);
    const realCurrentState = await readCurrentState(attestation);

    if (!realCurrentState || !stateWishedAfterProcess) {
      throw new Error('State could not be assigned');
    }

    if (realCurrentState === stateWishedAfterProcess) {
      removeFromExpiredInventory([attestation]);
    }
  }
}
