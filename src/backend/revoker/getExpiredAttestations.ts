import { configuration } from '../utilities/configuration';
import { filterGenerator } from '../utilities/filterGenerator';

import { scanAttestations } from './scanAttestations';

/**
 * Generator function to gather the expired attestations issued by SocialKYC.
 *
 * Their creation date `createdAt` lets us know if they are to be revoked or removed.
 *
 * @returns attestationInfo
 */
export function getExpiredAttestations() {
  const allAttestations = scanAttestations();
  const ourAttestations = filterGenerator(
    allAttestations,
    async (attestation) => {
      return attestation && attestation.owner === configuration.did;
    },
  );
  const existing = filterGenerator(ourAttestations, async (attestation) => {
    // return only attestations still on chain, not removed
    return attestation && attestation.revoked !== null;
  });
  return existing;
}
