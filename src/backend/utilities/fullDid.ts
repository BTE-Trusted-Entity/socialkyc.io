import {
  getKeypairByBackupPhrase,
  deriveDidAuthenticationKeypair,
} from '../../frontend/utilities/did';

import {
  DefaultResolver,
  DidUtils,
  DidChain,
  FullDidDetails,
} from '@kiltprotocol/did';
import { KeyRelationship } from '@kiltprotocol/types';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';
import { initKilt } from '../../frontend/utilities/initKilt';

function getKeyRelationships() {
  const identityKeypair = getKeypairByBackupPhrase(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );

  const didAuthKeypair = deriveDidAuthenticationKeypair(identityKeypair);

  const didAssertionKeypair = identityKeypair.derive('//did//assertion//0');
  return {
    [KeyRelationship.authentication]: didAuthKeypair,
    [KeyRelationship.assertionMethod]: didAssertionKeypair,
  };
}

export async function createFullDid(): Promise<void> {
  await initKilt();

  const relationships = getKeyRelationships();

  const { extrinsic, did } = await DidUtils.writeDidFromPublicKeys(
    {
      sign: async ({ data, alg }) => ({
        data: relationships[KeyRelationship.authentication].sign(data, {
          withType: false,
        }),
        alg,
      }),
    },
    relationships,
  );

  console.log(did);

  const identityKeypair = getKeypairByBackupPhrase(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );

  await BlockchainUtils.signAndSubmitTx(extrinsic, identityKeypair, {
    resolveOn: BlockchainUtils.IS_FINALIZED,
  });
}

export const fullDidPromise = (async () => {
  await initKilt();
  const didDetails = await DefaultResolver.resolveDoc(
    'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY',
  );
  if (!didDetails) {
    throw new Error();
  }

  return new FullDidDetails({
    did: didDetails.did,
    keys: didDetails.getKeys(),
    keyRelationships: {
      [KeyRelationship.authentication]: didDetails.getKeyIds(
        KeyRelationship.authentication,
      ),
      [KeyRelationship.assertionMethod]: didDetails.getKeyIds(
        KeyRelationship.assertionMethod,
      ),
    },
    lastTxIndex: await DidChain.queryLastTxIndex(didDetails.did),
    services: didDetails.getServices(),
  });
})();
