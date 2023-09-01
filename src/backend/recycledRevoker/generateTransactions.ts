import {
  ConfigService,
  Did,
  DidUri,
  KiltKeyringPair,
  SignExtrinsicCallback,
  SubmittableExtrinsic,
} from '@kiltprotocol/sdk-js';

import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';
import { signWithAssertionMethod } from '../utilities/cryptoCallbacks';
import { keypairsPromise } from '../utilities/keypairs';

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
  const condemnations: SubmittableExtrinsic[] = [];

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

    const { identity: submitterAccount } = await keypairsPromise;

    const newCondemnation = await authorizeRevocation(
      configuration.subscan.socialKYCDidUri,
      submitterAccount,
      signWithAssertionMethod,
      attestationInfo.claimHash,
      shouldRemove,
    );

    condemnations.push(newCondemnation);
  }

  return condemnations;
}

/**
 * Authorizes the revocation or the removal of one attested credential.
 * @param attester
 * @param submitterAccount
 * @param signCallback
 * @param claimHash
 * @param shouldRemove
 * @returns  The authorized transaction. Ready to sign and submit.
 */
async function authorizeRevocation(
  attester: DidUri,
  submitterAccount: KiltKeyringPair,
  signCallback: SignExtrinsicCallback,
  claimHash: `0x${string}`,
  shouldRemove = false,
): Promise<SubmittableExtrinsic> {
  const api = ConfigService.get('api');

  const transaction = shouldRemove
    ? // If the attestation is to be removed, create a `remove` tx,
      // which revokes and removes the attestation in one go.
      api.tx.attestation.remove(claimHash, null)
    : // Otherwise, simply revoke the attestation but leave it on chain.
      // Hence, the storage is not cleared and the deposit not returned.
      api.tx.attestation.revoke(claimHash, null);

  const authorizedTx = await Did.authorizeTx(
    attester,
    transaction,
    signCallback,
    submitterAccount.address,
  );

  return authorizedTx;
}
