import { SubmittableExtrinsic } from '@kiltprotocol/sdk-js';

import { logger } from '../utilities/logger';

import { generateTransactions } from './generateTransactions';

/**
 * List of `SubmittableExtrinsic`s to be gradually signed and submitted on batches.
 *
 * `SubmittableExtrinsic` are **transactions**, in this case, they could either be **Revocations** or **Removals**.
 */
export const expiredInventory: SubmittableExtrinsic[] = [];

export async function fillExpiredInventory(fromBlock: number) {
  const transactionGenerator = generateTransactions(fromBlock);

  for await (const extrinsicToSubmit of transactionGenerator) {
    expiredInventory.push(extrinsicToSubmit);
  }
}

export async function removeFromExpiredInventory(
  successfulTransactions: SubmittableExtrinsic[],
) {
  for (const extrinsicSubmitted of successfulTransactions) {
    const blackIndex = expiredInventory.findIndex((entry) => {
      return extrinsicSubmitted === entry;
    });

    expiredInventory.splice(blackIndex, 1);
    logger.trace('`SubmittableExtrinsic` removed from the `ExpiredInventory`');
  }
}
