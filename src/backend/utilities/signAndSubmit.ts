import type { SubmittableExtrinsic } from '@kiltprotocol/types';

import { authorizeTx } from '@kiltprotocol/did';
import { Blockchain } from '@kiltprotocol/chain-helpers';

import { fullDidPromise, getAssertionMethodSigners } from './fullDid';
import { keypairsPromise } from './keypairs';

export async function signAndSubmit(tx: SubmittableExtrinsic): Promise<void> {
  const { fullDid } = await fullDidPromise;
  const { identity } = await keypairsPromise;

  const signers = await getAssertionMethodSigners();

  const extrinsic = await authorizeTx(
    fullDid.id,
    tx,
    signers,
    identity.address,
  );

  await Blockchain.signAndSubmitTx(extrinsic, identity);
}
