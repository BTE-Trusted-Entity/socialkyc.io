import { SubmittableExtrinsic } from '@kiltprotocol/types';
import { Blockchain } from '@kiltprotocol/chain-helpers';
import * as Did from '@kiltprotocol/did';

import { fullDidPromise } from './fullDid';
import { keypairsPromise } from './keypairs';
import { signWithAssertionMethod } from './cryptoCallbacks';

export async function signAndSubmit(tx: SubmittableExtrinsic): Promise<void> {
  const { fullDid } = await fullDidPromise;
  const { identity } = await keypairsPromise;

  const extrinsic = await Did.authorizeTx(
    fullDid.uri,
    tx,
    signWithAssertionMethod,
    identity.address,
  );

  await Blockchain.signAndSubmitTx(extrinsic, identity);
}
