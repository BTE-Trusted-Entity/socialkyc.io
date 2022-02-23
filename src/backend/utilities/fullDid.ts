import { Keypair } from '@polkadot/util-crypto/types';
import {
  DefaultResolver,
  DidUtils,
  DidChain,
  FullDidDetails,
} from '@kiltprotocol/did';
import {
  KeyringPair,
  KeyRelationship,
  IDidKeyDetails,
  IDidDetails,
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
import { exitOnError } from './exitOnError';
import { logger } from './logger';

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

  logger.warn(did, 'This is your generated DID:');

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

  logger.warn('Attempting to update the key agreement key');
  const keypairs = await keypairsPromise;
  const existingKeyId = DidUtils.parseDidUrl(existingKey.id).fragment;

  const { api } = await BlockchainApiConnection.getConnectionOrConnect();
  const batchExtrinsic = api.tx.utility.batchAll([
    await DidChain.getRemoveKeyExtrinsic(keyAgreement, existingKeyId),
    await DidChain.getAddKeyExtrinsic(keyAgreement, keypairs.keyAgreement),
  ]);

  const fullDid = await createFullDidDetails(didDetails);
  const { identity } = keypairs;
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
    throw new Error(`Could not resolve ${didDetails.did} after key update`);
  }
  if (!didDocument.details.getKeys(keyAgreement).pop()) {
    throw new Error('Could not find the key agreement key after key update');
  }

  logger.warn('Key agreement key updated');
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
      logger.info('DID is already on the blockchain');
    } else {
      logger.warn('Storing DID on the blockchain');
      configuration.did = await createFullDid();
    }
  }

  const didDocument = await DefaultResolver.resolveDoc(configuration.did);
  if (!didDocument || !didDocument.details) {
    throw new Error(`Could not resolve the own DID ${configuration.did}`);
  }

  const didDetails = configuration.storeDidAndCTypes
    ? await ensureLatestEncryptionKey(didDocument.details)
    : didDocument.details;
  const fullDid = await createFullDidDetails(didDetails);

  await compareAllKeys(fullDid);

  const encryptionKey = fullDid.getKeys(keyAgreement).pop();
  if (!encryptionKey) {
    throw new Error('Key agreement key not found');
  }

  return { fullDid, encryptionKey };
})();

fullDidPromise.catch(exitOnError);
