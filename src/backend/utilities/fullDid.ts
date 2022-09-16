import { Keypair } from '@polkadot/util-crypto/types';
import {
  DidDocument,
  DidKey,
  DidUri,
  KeyRelationship,
  KeyringPair,
  KiltAddress,
  NewDidVerificationKey,
} from '@kiltprotocol/types';
import { Crypto } from '@kiltprotocol/utils';
import { Blockchain } from '@kiltprotocol/chain-helpers';
import { resolve, Chain, Utils } from '@kiltprotocol/did';

import { initKilt } from './initKilt';
import { keypairsPromise } from './keypairs';
import { configuration } from './configuration';
import { authenticationSigner } from './keystores';
import { exitOnError } from './exitOnError';
import { logger } from './logger';

function getDidKeyFromKeypair(keypair: KeyringPair): NewDidVerificationKey {
  return {
    ...keypair,
    type: 'sr25519',
  };
}

export async function createFullDid(): Promise<DidUri> {
  const keypairs = await keypairsPromise;
  const authenticationKey = getDidKeyFromKeypair(keypairs.authentication);
  const assertionKey = getDidKeyFromKeypair(keypairs.assertion);

  const extrinsic = await Chain.getStoreTx(
    {
      authentication: [authenticationKey],
      assertionMethod: [assertionKey],
      keyAgreement: [keypairs.keyAgreement],
    },
    keypairs.identity.address as KiltAddress,
    authenticationSigner,
  );

  await Blockchain.signAndSubmitTx(extrinsic, keypairs.identity, {
    resolveOn: Blockchain.IS_FINALIZED,
  });

  const uri = Utils.getFullDidUriFromKey(authenticationKey);

  logger.warn(uri, 'This is your generated DID:');

  return uri;
}

async function compareKeys(
  derived: KeyringPair | Keypair,
  resolved: DidKey | undefined,
  relationship: KeyRelationship,
): Promise<void> {
  if (!resolved) {
    throw new Error(`Resolved key for ${relationship} is undefined`);
  }
  const derivedHex = Crypto.u8aToHex(derived.publicKey);
  const resolvedHex = Crypto.u8aToHex(resolved.publicKey);
  if (derivedHex !== resolvedHex) {
    throw new Error(
      `Derived key for ${relationship} does not match resolved one ${resolved.id}`,
    );
  }
}

async function compareAllKeys(fullDid: DidDocument): Promise<void> {
  const keypairs = await keypairsPromise;

  await compareKeys(
    keypairs.authentication,
    fullDid.authentication[0],
    'authentication',
  );
  await compareKeys(
    keypairs.assertion,
    fullDid.assertionMethod?.[0],
    'assertionMethod',
  );
  await compareKeys(
    keypairs.keyAgreement,
    fullDid.keyAgreement?.[0],
    'keyAgreement',
  );
}

export const fullDidPromise = (async () => {
  await initKilt();

  if (configuration.storeDidAndCTypes) {
    if (configuration.did !== 'pending' && (await resolve(configuration.did))) {
      logger.info('DID is already on the blockchain');
    } else {
      logger.warn('Storing DID on the blockchain');
      configuration.did = await createFullDid();
    }
  }

  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  const fullDid = await resolve(configuration.did);
  if (!fullDid || !fullDid.document) {
    throw new Error(`Could not resolve the own DID ${configuration.did}`);
  }

  await compareAllKeys(fullDid.document);
  const { keyAgreement } = fullDid.document;
  if (!keyAgreement) {
    throw new Error('Key agreement key not found');
  }

  return { fullDid: fullDid.document, encryptionKey: keyAgreement[0] };
})();

fullDidPromise.catch(exitOnError);
