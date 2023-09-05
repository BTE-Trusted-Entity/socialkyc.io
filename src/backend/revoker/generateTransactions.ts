import { ConfigService, SubmittableExtrinsic } from '@kiltprotocol/sdk-js';

import { initKilt } from '../utilities/initKilt';

import { AttestationInfo } from './scanAttestations';
import { deduceWishedState } from './stateIdentifiers';

/**
 * Generates `SubmittableExtrinsic`s to revoke or remove old attestations issued by SocialKYC.
 *
 * If they are older than 1 year, they should be revoked.
 * If they are older than 2 years, they should be removed.
 */
export async function generateTransactions(
  arrayOfAttestationsInfo: AttestationInfo[],
): Promise<SubmittableExtrinsic[]> {
  await initKilt();
  const api = ConfigService.get('api');

  return arrayOfAttestationsInfo.flatMap((attestationInfo) => {
    const wishedState = deduceWishedState(attestationInfo);

    if (wishedState === 'removed') {
      return [api.tx.attestation.remove(attestationInfo.claimHash, null)];
    }

    if (wishedState === 'revoked') {
      return [api.tx.attestation.revoke(attestationInfo.claimHash, null)];
    }
    return [];
  });
}
