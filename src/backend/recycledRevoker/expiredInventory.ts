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

  for await (const transactionToSubmit of transactionGenerator) {
    expiredInventory.push(transactionToSubmit);
  }
}

export async function removeFromExpiredInventory(
  successfulTransactions: SubmittableExtrinsic[],
) {
  for (const transactionSubmitted of successfulTransactions) {
    const inventoryIndex = expiredInventory.findIndex(
      (entry) => transactionSubmitted === entry,
    );
    if (inventoryIndex < 0) {
      continue;
    }

    expiredInventory.splice(inventoryIndex, 1);
    logger.trace('`SubmittableExtrinsic` removed from the `ExpiredInventory`');
  }
}
