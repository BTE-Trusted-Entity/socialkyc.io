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
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';

import { initKilt } from './initKilt';
import { keypairsPromise } from './keypairs';
import { configuration } from './configuration';
import { authenticationKeystore } from './keystores';
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

  const fullDid = await createFullDidDetails(didDocument.details);

  await compareAllKeys(fullDid);

  const encryptionKey = fullDid.getKeys(keyAgreement).pop();
  if (!encryptionKey) {
    throw new Error('Key agreement key not found');
  }

  return { fullDid, encryptionKey };
})();

fullDidPromise.catch(exitOnError);
