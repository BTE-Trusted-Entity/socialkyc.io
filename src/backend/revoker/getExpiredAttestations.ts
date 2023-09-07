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
  const old = scanAttestations();
  const own = filterGenerator(
    old,
    async ({ owner }) => owner === configuration.did,
  );
  const existing = filterGenerator(
    own,
    async ({ revoked }) => revoked !== null, // still present on the blockchain
  );
  return existing;
}
