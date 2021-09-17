import {
  DefaultResolver,
  DidUtils,
  DidChain,
  FullDidDetails,
} from '@kiltprotocol/did';
import { KeyRelationship } from '@kiltprotocol/types';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';

import { initKilt } from './initKilt';
import { keypairsPromise } from './keypairs';
import { configuration } from './configuration';
import { authenticationKeystore } from './keystores';

const { authentication, assertionMethod, keyAgreement } = KeyRelationship;

export async function createFullDid(): Promise<void> {
  const keypairs = await keypairsPromise;
  const relationships = {
    [authentication]: keypairs.authentication,
    [assertionMethod]: keypairs.assertion,
    [keyAgreement]: { ...keypairs.keyAgreement, type: 'x25519' },
  };

  const { extrinsic, did } = await DidUtils.writeDidFromPublicKeys(
    authenticationKeystore,
    relationships,
  );

  console.log('This is your generated DID:', did);

  await BlockchainUtils.signAndSubmitTx(extrinsic, keypairs.identity, {
    resolveOn: BlockchainUtils.IS_FINALIZED,
  });
}

export const fullDidPromise = (async () => {
  await initKilt();

  const didDetails = await DefaultResolver.resolveDoc(configuration.did);
  if (!didDetails) {
    throw new Error();
  }

  return new FullDidDetails({
    did: didDetails.did,
    keys: didDetails.getKeys(),
    keyRelationships: {
      [authentication]: didDetails.getKeyIds(authentication),
      [assertionMethod]: didDetails.getKeyIds(assertionMethod),
      [keyAgreement]: didDetails.getKeyIds(keyAgreement),
    },
    lastTxIndex: await DidChain.queryLastTxIndex(didDetails.did),
    services: didDetails.getServices(),
  });
})();
