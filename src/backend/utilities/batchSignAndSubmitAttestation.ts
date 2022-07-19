import { Attestation } from '@kiltprotocol/core';
import {
  BlockchainApiConnection,
  BlockchainUtils,
} from '@kiltprotocol/chain-helpers';
import { DidBatchBuilder } from '@kiltprotocol/did';

import { logger } from './logger';
import { fullDidPromise } from './fullDid';
import { keypairsPromise } from './keypairs';
import { assertionKeystore } from './keystores';
import { signAndSubmit } from './signAndSubmit';

const TRANSACTION_TIMEOUT = 5 * 60 * 1000;
const MAXIMUM_FAILURES = 3;

interface AttemptedAttestation {
  attestation: Attestation;
  failures: number;
}

let currentAttestations: AttemptedAttestation[] = [];
let currentTransaction: Promise<void> | undefined = undefined;
let pendingAttestations: AttemptedAttestation[] = [];
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

async function timeout(delay: number, error: Error) {
  return new Promise((resolve, reject) =>
    setTimeout(() => reject(error), delay),
  );
}

async function runTransactionWithTimeout<Result>(transaction: Promise<Result>) {
  await Promise.race([
    transaction,
    timeout(TRANSACTION_TIMEOUT, new Error('Transaction timed out')),
  ]);
}

async function createPendingTransaction() {
  try {
    await currentTransaction;
    logger.debug('Current transaction succeeded');
  } catch (error) {
    logger.error(error);
  }

  for (const { attestation, failures } of currentAttestations) {
    const attested = Boolean(await Attestation.query(attestation.claimHash));
    const failedTooManyTimes = failures >= MAXIMUM_FAILURES;
    if (attested || failedTooManyTimes) {
      continue;
    }
    pendingAttestations.unshift({
      attestation,
      failures: failures + 1,
    });
  }
  // TODO: when dependencies versions issue is resolved, optimize the code above using
  // api.query.attestation.attestations.multi<Option<Codec>>(hashes)

  if (syncExitAfterUpdatingReferences()) {
    logger.debug('No next transaction scheduled');
    return;
  }
  logger.debug('Scheduling next transaction');

  const extrinsics = await Promise.all(
    currentAttestations.map(({ attestation }) => attestation.getStoreTx()),
  );
  const { api } = await BlockchainApiConnection.getConnectionOrConnect();
  const { fullDid } = await fullDidPromise;
  const { identity } = await keypairsPromise;

  const authorized = await new DidBatchBuilder(api, fullDid)
    .addMultipleExtrinsics(extrinsics)
    .build(assertionKeystore, identity.address, { atomic: false });

  logger.debug('Submitting transaction');
  await runTransactionWithTimeout(
    BlockchainUtils.signAndSubmitTx(authorized, identity, {
      resolveOn: BlockchainUtils.IS_FINALIZED,
    }),
  );
  logger.debug('Transaction submitted');
}

function alreadyAddedTo(
  list: AttemptedAttestation[],
  attestation: Attestation,
) {
  return list.some(
    ({ attestation: { claimHash } }) => claimHash === attestation.claimHash,
  );
}

export async function batchSignAndSubmitAttestation(attestation: Attestation) {
  // prevent two identical attestations from going into the same batch
  if (alreadyAddedTo(currentAttestations, attestation)) {
    return currentTransaction;
  }

  if (!alreadyAddedTo(pendingAttestations, attestation)) {
    pendingAttestations.push({ attestation, failures: 0 });
  }

  if (pendingTransaction) {
    logger.debug('Scheduled attestation for next transaction');
    return pendingTransaction;
  }

  logger.debug('Started immediate attestation');
  pendingTransaction = runTransactionWithTimeout(
    (async () => {
      const transaction = await attestation.getStoreTx();
      await signAndSubmit(transaction);
    })(),
  );
  syncExitAfterUpdatingReferences();

  return currentTransaction;
}
