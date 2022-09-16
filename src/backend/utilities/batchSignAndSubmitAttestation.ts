import { Blockchain } from '@kiltprotocol/chain-helpers';
import { authorizeBatch } from '@kiltprotocol/did';
import { ConfigService } from '@kiltprotocol/config';
import { IAttestation } from '@kiltprotocol/types';

import { logger } from './logger';
import { fullDidPromise } from './fullDid';
import { keypairsPromise } from './keypairs';
import { assertionSigner } from './keystores';
import { signAndSubmit } from './signAndSubmit';

const TRANSACTION_TIMEOUT = 5 * 60 * 1000;
const MAXIMUM_FAILURES = 3;

interface AttemptedAttestation {
  attestation: IAttestation;
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
  const api = ConfigService.get('api');

  try {
    await currentTransaction;
    logger.debug('Current transaction succeeded');
  } catch (error) {
    logger.error(error);
  }

  for (const { attestation, failures } of currentAttestations) {
    const attested = (await api.query.attestation.attestations(attestation.claimHash)).isSome;
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

  const extrinsics = currentAttestations.map(
    ({ attestation: { cTypeHash, claimHash } }) =>
      api.tx.attestation.add(claimHash, cTypeHash, null),
  );

  const { fullDid } = await fullDidPromise;
  const { identity } = await keypairsPromise;

  const authorized = await authorizeBatch({
    did: fullDid,
    extrinsics,
    sign: assertionSigner,
    submitter: identity.address,
    batchFunction: api.tx.utility.batchAll,
  });

  logger.debug('Submitting transaction');
  await runTransactionWithTimeout(
    Blockchain.signAndSubmitTx(authorized, identity, {
      resolveOn: Blockchain.IS_FINALIZED,
    }),
  );
  logger.debug('Transaction submitted');
}

function alreadyAddedTo(
  list: AttemptedAttestation[],
  attestation: IAttestation,
) {
  return list.some(
    ({ attestation: { claimHash } }) => claimHash === attestation.claimHash,
  );
}

export async function batchSignAndSubmitAttestation(attestation: IAttestation) {
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
      const api = ConfigService.get('api');
      const transaction = api.tx.attestation.add(
        attestation.claimHash,
        attestation.cTypeHash,
        null,
      );
      await signAndSubmit(transaction);
    })(),
  );
  syncExitAfterUpdatingReferences();

  return currentTransaction;
}
