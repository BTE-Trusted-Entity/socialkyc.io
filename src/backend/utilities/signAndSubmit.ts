import { SubmittableExtrinsic } from '@kiltprotocol/types';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';

import { fullDidPromise } from './fullDid';
import { keypairsPromise } from './keypairs';
import { assertionKeystore } from './keystores';

export async function signAndSubmit(tx: SubmittableExtrinsic): Promise<void> {
  const { fullDid } = await fullDidPromise;
  const { identity } = await keypairsPromise;

  // TODO: Remove when we get SDK upgrade which includes this call in authorizeExtrinsic
  await fullDid.refreshTxIndex();

  const extrinsic = await fullDid.authorizeExtrinsic(
    tx,
    assertionKeystore,
    identity.address,
  );

  await BlockchainUtils.signAndSubmitTx(extrinsic, identity, {
    resolveOn: BlockchainUtils.IS_FINALIZED,
    reSign: true,
  });
}
