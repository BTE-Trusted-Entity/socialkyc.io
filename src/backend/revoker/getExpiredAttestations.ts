import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';
import { filterG } from '../utilities/filterG';

import { AttestationInfo, scanAttestations } from './scanAttestations';
import { readCurrentStates, shouldBeRevoked } from './stateIdentifiers';

/**
 * Generator function to gather the expired attestations issued by SocialKYC.
 *
 * Their creation date `createdAt` lets us know if they are to be revoked or removed.
 *
 * @param fromBlock decides where to start the blockchain scan.
 * @returns attestationInfo
 */
export async function* getExpiredAttestations(
  fromBlock = 0,
): AsyncGenerator<AttestationInfo> {
  const allAttestations = scanAttestations(fromBlock);
  const ownAttestations = filterG(
    allAttestations,
    async ({ owner }) => owner === configuration.did,
  );
  const validAttestations = filterG(ownAttestations, async (attestation) => {
    const [state] = await readCurrentStates([attestation]);
    return state !== 'removed';
  });

  for await (const attestationInfo of validAttestations) {
    if (shouldBeRevoked(attestationInfo)) {
      yield attestationInfo;
    } else {
      logger.debug('No more attestations to revoke');
      return;
    }
  }
}
