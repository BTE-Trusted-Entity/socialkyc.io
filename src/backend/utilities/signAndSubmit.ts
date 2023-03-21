import { Blockchain, Did, SubmittableExtrinsic } from '@kiltprotocol/sdk-js';

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
