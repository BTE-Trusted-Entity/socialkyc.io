import { logger } from '../utilities/logger';

import { AttestationInfo } from './scanAttestations';
import { removeFromExpiredInventory } from './expiredInventory';
import { deduceWishedState, readCurrentStates } from './stateIdentifiers';

/**
 * Checks if the attestation were successfully revoked or removed.
 *
 * @param attestationsInfo Array of AttestationInfo of the credentials that should have been processed.
 * @returns
 */
export async function updateExpiredInventory(
  attestationsInfo: AttestationInfo[],
) {
  const currentStates = await readCurrentStates(attestationsInfo);

  for (const [index, attestation] of attestationsInfo.entries()) {
    const stateWishedAfterProcess = deduceWishedState(attestation);
    const realCurrentState = currentStates[index];

    if (!realCurrentState || !stateWishedAfterProcess) {
      throw new Error('State could not be assigned');
    }
    if (stateWishedAfterProcess === 'valid') {
      logger.error(
        `This credential is to young to be here:  ${attestation.claimHash}`,
      );
    }

    if (realCurrentState === stateWishedAfterProcess) {
      removeFromExpiredInventory([attestation]);
    }
  }
}
