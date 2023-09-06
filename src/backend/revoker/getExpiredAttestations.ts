import { configuration } from '../utilities/configuration';
import { filterG } from '../utilities/filterG';

import { AttestationInfo, scanAttestations } from './scanAttestations';

/**
 * Generator function to gather the expired attestations issued by SocialKYC.
 *
 * Their creation date `createdAt` lets us know if they are to be revoked or removed.
 *
 * @returns attestationInfo
 */
export async function* getExpiredAttestations(): AsyncGenerator<AttestationInfo> {
  const old = scanAttestations();
  const own = filterG(old, async ({ owner }) => owner === configuration.did);
  const existing = filterG(own, async ({ revoked }) => revoked !== null);
  return existing;
}
