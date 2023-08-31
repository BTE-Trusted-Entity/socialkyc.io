import {
  Attestation,
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

import { scanAttestations, AttestationInfo } from './scanAttestations';

/**
 * Generator function to gather the old attestations issued by SocialKYC and assigns validity states.
 *
 * "Old" means longer than a calendar year.
 *
 * Their validity `state` and the their creation date `createdAt` let us know, if they are to be revoked or removed.
 *
 * If they are older than a year, they should be revoked.
 * If they are older than 2 years, they should be removed.
 *
 * @param fromBlock decides where to start the blockchain scan.
 * @returns `attestationInfo`s that are either `valid` or `revoked`
 */
export async function* expiredCredentialsGetter(
  fromBlock = 0,
): AsyncGenerator<AttestationInfo> {
  // Generator for attestationInfos of credentials issued by socialKYC
  const ourAttestationsGenerator = filterByAttester(
    scanAttestations(fromBlock),
    configuration.subscan.socialKYCDidUri,
  );

  for await (const attestationInfoStateless of ourAttestationsGenerator) {
    const attestationInfo = await assignState(attestationInfoStateless);

    // find the next attestation that has not been removed yet:
    if (attestationInfo.state === 'removed') {
      continue;
    }
    if (typeof attestationInfo.state === undefined) {
      // this should never happen
      throw new Error(
        `Could not assign a validity state for this credential ${attestationInfo.claimHash}`,
      );
    }
    const dateOfIssuance = attestationInfo.createdAt.getTime();
    const dateNow = Date.now();
    const millisecondsInAYear = new Date('1971').getTime();

    // if younger than a year
    if (dateOfIssuance > dateNow - 1 * millisecondsInAYear) {
      logger.debug(
        'No more credentials younger than a year attested by SocialKYC.',
      );
      // end the generator:
      return;
    }
    yield attestationInfo;
  }
}

/**
 * Generates `SubmittableExtrinsic`s to revoke or remove old attestations issued by SocialKYC.
 *
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

async function* filterByAttester(
  attestationGenerator: AsyncGenerator<AttestationInfo>,
  wishedDID: DidUri,
) {
  for await (const attestation of attestationGenerator) {
    if (!attestation) {
      logger.debug('No more attestations found.');
    }

    const didOfAttester = attestation.owner;
    if (wishedDID === didOfAttester) {
      yield attestation;
    }
  }
}

async function assignState(
  attestationInfo: AttestationInfo | void,
): Promise<AttestationInfo> {
  if (!attestationInfo) {
    throw new Error('attestation is empty');
  }
  const api = ConfigService.get('api');

  const attestationEncoded = await api.query.attestation.attestations(
    attestationInfo.claimHash,
  );
  if (attestationEncoded.isNone) {
    attestationInfo.state = 'removed';
    return attestationInfo;
  }

  const attestationDecoded = Attestation.fromChain(
    attestationEncoded,
    attestationInfo.claimHash,
  );

  if (attestationDecoded.revoked === false) {
    attestationInfo.state = 'valid';
    return attestationInfo;
  }
  if (attestationDecoded.revoked === true) {
    attestationInfo.state = 'revoked';
    return attestationInfo;
  }

  // Else:
  // including  attestationInfo.state === undefined
  throw new Error(
    `Could not assign any state to the attestation: ${attestationInfo.claimHash}`,
  );
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
