import { SubmittableExtrinsic } from '@kiltprotocol/sdk-js';

import { logger } from '../utilities/logger';

import { generateTransactions } from './generateTransactions';

/**
 * List of `SubmittableExtrinsic`s to be gradually signed and submitted on batches.
 *
 * `SubmittableExtrinsic` are **transactions**, in this case, they could either be **Revocations** or **Removals**.
 */
export const blackList: SubmittableExtrinsic[] = [];

export async function fillBlackList(fromBlock: number) {
  const transactionGenerator = generateTransactions(fromBlock);

  for await (const extrinsicToSubmit of transactionGenerator) {
    blackList.push(extrinsicToSubmit);
  }
}

export async function removeFromBlackList(
  successfulTransactions: SubmittableExtrinsic[],
) {
  for (const extrinsicSubmitted of successfulTransactions) {
    const blackIndex = blackList.findIndex((entry) => {
      return extrinsicSubmitted === entry;
    });

    blackList.splice(blackIndex, 1);
    logger.debug('`SubmittableExtrinsic` removed from the `blackList`');
  }
}
