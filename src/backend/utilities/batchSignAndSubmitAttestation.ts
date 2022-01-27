import { Attestation } from '@kiltprotocol/core';
import {
  BlockchainApiConnection,
  BlockchainUtils,
} from '@kiltprotocol/chain-helpers';

import { logger } from './logger';
import { fullDidPromise } from './fullDid';
import { keypairsPromise } from './keypairs';
import { didAuthorizeBatchExtrinsic } from './didAuthorizeBatchExtrinsic';
import { assertionKeystore } from './keystores';
import { signAndSubmit } from './signAndSubmit';

let currentAttestations: Attestation[] = [];
let currentTransaction: Promise<void> | undefined = undefined;
let pendingAttestations: Attestation[] = [];
let pendingTransaction: Promise<void> | undefined = undefined;

function syncExitAfterUpdatingReferences(): boolean {
  const noNextTransactionNeeded = pendingAttestations.length === 0;
  if (noNextTransactionNeeded) {
    currentAttestations = [];
    currentTransaction = undefined;
    pendingAttestations = [];
    pendingTransaction = undefined;
    return true;
  }

  currentAttestations = pendingAttestations;
  currentTransaction = pendingTransaction;
  pendingAttestations = [];
  pendingTransaction = createPendingTransaction();
  return false;
}

async function createPendingTransaction() {
  try {
    await currentTransaction;
    logger.debug('Current transaction succeeded');
  } catch (error) {
    logger.error(error);
    // an error means that the current attestations failed, so we schedule them to be done again
    pendingAttestations = currentAttestations.concat(pendingAttestations);
  }

  if (syncExitAfterUpdatingReferences()) {
    logger.debug('No next transaction scheduled');
    return;
  }
  logger.debug('Scheduling next transaction');

  const extrinsics = await Promise.all(
    currentAttestations.map((attestation) => attestation.store()),
  );
  const { api } = await BlockchainApiConnection.getConnectionOrConnect();
  const batchExtrinsic = api.tx.utility.batchAll(extrinsics);

  const { fullDid } = await fullDidPromise;
  const { identity } = await keypairsPromise;

  logger.debug('Signing transaction');
  const authorized = await didAuthorizeBatchExtrinsic(
    fullDid,
    batchExtrinsic,
    assertionKeystore,
    identity.address,
  );

  logger.debug('Submitting transaction');
  await BlockchainUtils.signAndSubmitTx(authorized, identity, {
    resolveOn: BlockchainUtils.IS_FINALIZED,
    reSign: true,
  });
  logger.debug('Transaction submitted');
}

export async function batchSignAndSubmitAttestation(attestation: Attestation) {
  pendingAttestations.push(attestation);

  if (pendingTransaction) {
    logger.debug('Scheduled attestation for next transaction');
    return pendingTransaction;
  }

  logger.debug('Started immediate attestation');
  pendingTransaction = (async () => {
    const transaction = await attestation.store();
    await signAndSubmit(transaction);
  })();
  syncExitAfterUpdatingReferences();

  return currentTransaction;
}
