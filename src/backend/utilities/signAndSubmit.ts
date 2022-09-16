import { SubmittableExtrinsic } from '@kiltprotocol/types';
import { Blockchain } from '@kiltprotocol/chain-helpers';
import { authorizeExtrinsic } from '@kiltprotocol/did';

import { fullDidPromise } from './fullDid';
import { keypairsPromise } from './keypairs';
import { assertionSigner } from './keystores';

export async function signAndSubmit(tx: SubmittableExtrinsic): Promise<void> {
  const { fullDid } = await fullDidPromise;
  const { identity } = await keypairsPromise;

  const extrinsic = await authorizeExtrinsic(
    fullDid,
    tx,
    assertionSigner,
    identity.address,
  );

  await Blockchain.signAndSubmitTx(extrinsic, identity, {
    resolveOn: Blockchain.IS_FINALIZED,
  });
}
