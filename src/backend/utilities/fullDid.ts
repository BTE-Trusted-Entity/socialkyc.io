import { Keypair } from '@polkadot/util-crypto/types';
import {
  DefaultResolver,
  DidChain,
  DidUtils,
  FullDidDetails,
} from '@kiltprotocol/did';
import {
  IDidDetails,
  IDidKeyDetails,
  KeyRelationship,
  KeyringPair,
} from '@kiltprotocol/types';
import { Crypto } from '@kiltprotocol/utils';
import {
  BlockchainApiConnection,
  BlockchainUtils,
} from '@kiltprotocol/chain-helpers';

import { initKilt } from './initKilt';
import { keypairsPromise } from './keypairs';
import { configuration } from './configuration';
import { authenticationKeystore } from './keystores';
import { didAuthorizeBatchExtrinsic } from './didAuthorizeBatchExtrinsic';

const { authentication, assertionMethod, keyAgreement } = KeyRelationship;

export async function createFullDid(): Promise<IDidDetails['did']> {
  const keypairs = await keypairsPromise;
  const relationships = {
    [authentication]: keypairs.authentication,
    [assertionMethod]: keypairs.assertion,
    [keyAgreement]: keypairs.keyAgreement,
  };

  const { extrinsic, did } = await DidUtils.writeDidFromPublicKeys(
    authenticationKeystore,
    keypairs.identity.address,
    relationships,
  );

  console.log('This is your generated DID:', did);

  await BlockchainUtils.signAndSubmitTx(extrinsic, keypairs.identity, {
    resolveOn: BlockchainUtils.IS_FINALIZED,
  });

  return did;
}

async function createFullDidDetails(didDetails: IDidDetails) {
  return new FullDidDetails({
    did: didDetails.did,
    keys: didDetails.getKeys(),
    keyRelationships: {
      [authentication]: didDetails.getKeyIds(authentication),
      [assertionMethod]: didDetails.getKeyIds(assertionMethod),
      [keyAgreement]: didDetails.getKeyIds(keyAgreement),
    },
    lastTxIndex: await DidChain.queryLastTxCounter(didDetails.did),
  });
}

async function ensureLatestEncryptionKey(
  didDetails: IDidDetails,
): Promise<IDidDetails> {
  const existingKey = didDetails.getKeys(keyAgreement).pop();
  if (!existingKey) {
    throw new Error('Key agreement key not found');
  }

  const keyToUpdate =
    '0xf2c90875e0630bd1700412341e5e9339a57d2fefdbba08de1cac8db5b4145f6e';
  const noUpdateNeeded = existingKey.publicKeyHex !== keyToUpdate;
  if (noUpdateNeeded) {
    return didDetails;
  }

  const keypairs = await keypairsPromise;
  const { api } = await BlockchainApiConnection.getConnectionOrConnect();
  const batchExtrinsic = api.tx.utility.batch([
    await DidChain.getAddKeyExtrinsic(keyAgreement, keypairs.keyAgreement),
    await DidChain.getRemoveKeyExtrinsic(keyAgreement, existingKey.id),
  ]);

  const { identity } = keypairs;
  const fullDid = await createFullDidDetails(didDetails);
  const authorized = await didAuthorizeBatchExtrinsic(
    fullDid,
    batchExtrinsic,
    authenticationKeystore,
    identity.address,
  );

  await BlockchainUtils.signAndSubmitTx(authorized, identity, {
    resolveOn: BlockchainUtils.IS_FINALIZED,
    reSign: true,
  });

  const didDocument = await DefaultResolver.resolveDoc(didDetails.did);
  if (!didDocument || !didDocument.details) {
    throw new Error(`Could not resolve ${didDetails.did} after key upgrade`);
  }

  return didDocument.details;
}

async function compareKeys(
  derived: KeyringPair | Keypair,
  fullDid: FullDidDetails,
  relationship: KeyRelationship,
): Promise<void> {
  const derivedHex = Crypto.u8aToHex(derived.publicKey);
  const resolved = fullDid.getKeys(relationship).pop() as IDidKeyDetails;
  const resolvedHex = resolved.publicKeyHex;
  if (derivedHex !== resolvedHex) {
    throw new Error(
      `Derived key for ${relationship} does not match resolved one ${resolved.id}`,
    );
  }
}

async function compareAllKeys(fullDid: FullDidDetails): Promise<void> {
  const keypairs = await keypairsPromise;

  await compareKeys(keypairs.authentication, fullDid, authentication);
  await compareKeys(keypairs.assertion, fullDid, assertionMethod);
  await compareKeys(keypairs.keyAgreement, fullDid, keyAgreement);
}

export const fullDidPromise = (async () => {
  await initKilt();

  if (configuration.storeDidAndCTypes) {
    if (
      configuration.did !== 'pending' &&
      (await DefaultResolver.resolveDoc(configuration.did))
    ) {
      console.log('DID is already on the blockchain');
    } else {
      console.log('Storing DID on the blockchain');
      configuration.did = await createFullDid();
    }
  }

  const didDocument = await DefaultResolver.resolveDoc(configuration.did);
  if (!didDocument || !didDocument.details) {
    throw new Error(`Could not resolve the own DID ${configuration.did}`);
  }

  const didDetails = await ensureLatestEncryptionKey(didDocument.details);
  const fullDid = await createFullDidDetails(didDetails);

  await compareAllKeys(fullDid);

  const encryptionKey = fullDid.getKeys(keyAgreement).pop();
  if (!encryptionKey) {
    throw new Error('Key agreement key not found');
  }

  return { fullDid, encryptionKey };
})();
