import { ConfigService, SubmittableExtrinsic } from '@kiltprotocol/sdk-js';

import { logger } from '../utilities/logger';

import { AttestationInfo } from './scanAttestations';

/**
 * Generates `SubmittableExtrinsic`s to revoke or remove old attestations issued by SocialKYC.
 *
 * If they are older than 1 year, they should be revoked.
 * If they are older than 2 years, they should be removed.
 */
export async function generateTransactions(
  arrayOfAttestationsInfo: AttestationInfo[],
): Promise<SubmittableExtrinsic[]> {
  const transactions: SubmittableExtrinsic[] = [];
  const api = ConfigService.get('api');

  for (const attestationInfo of arrayOfAttestationsInfo) {
    const dateOfIssuance = attestationInfo.createdAt.getTime();
    const dateNow = Date.now();
    const millisecondsInAYear = new Date('1971').getTime();

    // if younger than a year
    if (dateOfIssuance > dateNow - 1 * millisecondsInAYear) {
      logger.error(
        `This credential is to young to be here:  ${attestationInfo.claimHash}`,
      );
    }

    // Decide whether to remove or to revoke:
    let shouldRemove: boolean = false;

    // if older than 2 years
    if (dateOfIssuance < dateNow - 2 * millisecondsInAYear) {
      // either "valid" or "revoked" should be removed after 2 years
      shouldRemove = true;
    }

    // if it is older than 1 year, younger than 2 years and was already revoked:
    if (attestationInfo.state === 'revoked') {
      continue;
    }

    const transaction = shouldRemove
      ? // If the attestation is to be removed, create a `remove` tx,
        // which revokes and removes the attestation in one go.
        api.tx.attestation.remove(attestationInfo.claimHash, null)
      : // Otherwise, simply revoke the attestation but leave it on chain.
        // Hence, the storage is not cleared and the deposit not returned.
        api.tx.attestation.revoke(attestationInfo.claimHash, null);

    transactions.push(transaction);
  }

  return transactions;
}
