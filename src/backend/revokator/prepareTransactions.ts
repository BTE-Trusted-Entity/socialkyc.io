import {
  DidUri,
  KiltKeyringPair,
  SignExtrinsicCallback,
  SubmittableExtrinsic,
  ConfigService,
  Did,
  DidResourceUri,
  connect,
} from '@kiltprotocol/sdk-js';

import { configuration } from '../utilities/configuration';

import { fullDidPromise } from '../utilities/fullDid';
import { signWithAssertionMethod } from '../utilities/cryptoCallbacks';
import { keypairsPromise } from '../utilities/keypairs';

import { scanForOldCredentials } from './scanForOldCredentials';

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

// const blockYear: number = (60 * 60 * 24 * 365) / 12; // seconds in a year divided by 12s/block.
// const blockMonth: number = blockYear / 12;

// TODO: Save the block number of the last successful revocation.

export async function prepareRevocations(
  fromBlock: number,
  toBlock: number,
): Promise<SubmittableExtrinsic[]> {
  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  await connect(configuration.blockchainEndpoint);

  const hashesOfCredentialAttestations = (await scanForOldCredentials(
    fromBlock,
    toBlock,
    false,
  )) as `0x${string}`[];

  const condemnations: SubmittableExtrinsic[] = [];

  const { identity: submitterAccount } = await keypairsPromise;

  const { fullDid: didDocument } = await fullDidPromise;

  const keyUri = didDocument.assertionMethod?.toString() as DidResourceUri;
  if (!keyUri) {
    throw new Error('Key not found');
  }

  for (let index = 0; index < hashesOfCredentialAttestations.length; index++) {
    const newCondemnation = await authorizeRevocation(
      configuration.did,
      submitterAccount,
      signWithAssertionMethod,
      hashesOfCredentialAttestations[index],
      false,
    );
    condemnations.push(newCondemnation);
  }

//   disconnect();

  return condemnations;
}
