import type {
  Did,
  DidDocument,
  DidUrl,
  KeyringPair,
  VerificationMethod,
  VerificationRelationship,
} from '@kiltprotocol/types';
import type { Keypair } from '@polkadot/util-crypto/types';

import {
  createLightDidDocument,
  getFullDid,
  getStoreTx,
  isFailedDereferenceMetadata,
  multibaseKeyToDidKey,
} from '@kiltprotocol/did';

import { Crypto, Signers } from '@kiltprotocol/utils';

import { DidResolver, signAndSubmitTx } from '@kiltprotocol/sdk-js';

import { initKilt } from './initKilt';
import { keypairsPromise } from './keypairs';
import { configuration } from './configuration';
import { exitOnError } from './exitOnError';
import { logger } from './logger';

export async function createFullDid(): Promise<Did> {
  const { assertionMethod, authentication, identity, keyAgreement } =
    await keypairsPromise;

  const lightDidDocument = createLightDidDocument({
    authentication: [authentication],
    keyAgreement: [keyAgreement],
  });

  const did = getFullDid(lightDidDocument.id);

  const signers = await Signers.getSignersForKeypair({
    keypair: authentication,
    id: authentication.address,
  });

  const extrinsic = await getStoreTx(
    {
      authentication: [authentication],
      assertionMethod: [assertionMethod],
      keyAgreement: [keyAgreement],
    },
    identity.address,
    signers,
  );

  await signAndSubmitTx(extrinsic, identity);

  logger.warn(did, 'This is your generated DID:');

  return did;
}

async function compareKeys(
  derived: KeyringPair | Keypair,
  keyUrl: DidUrl,
  relationship: VerificationRelationship,
): Promise<void> {
  const { dereferencingMetadata, contentStream } =
    await DidResolver.dereference(keyUrl, {});

  if (isFailedDereferenceMetadata(dereferencingMetadata)) {
    throw new Error(dereferencingMetadata.error);
  }

  const { publicKeyMultibase } = contentStream as VerificationMethod;
  const { publicKey } = multibaseKeyToDidKey(publicKeyMultibase);

  const derivedHex = Crypto.u8aToHex(derived.publicKey);
  const resolvedHex = Crypto.u8aToHex(publicKey);
  if (derivedHex !== resolvedHex) {
    throw new Error(
      `Derived key for ${relationship} does not match resolved one ${keyUrl}`,
    );
  }
}

async function compareAllKeys(fullDid: DidDocument): Promise<void> {
  const keypairs = await keypairsPromise;

  await compareKeys(
    keypairs.authentication,
    `${fullDid.id}${fullDid.authentication?.[0]}` as DidUrl,
    'authentication',
  );
  await compareKeys(
    keypairs.assertionMethod,
    `${fullDid.id}${fullDid.assertionMethod?.[0]}` as DidUrl,
    'assertionMethod',
  );
  await compareKeys(
    keypairs.keyAgreement,
    `${fullDid.id}${fullDid.keyAgreement?.[0]}` as DidUrl,
    'keyAgreement',
  );
}

export async function getAssertionMethodSigners() {
  const { assertionMethod } = await keypairsPromise;
  const { fullDid } = await fullDidPromise;

  return await Signers.getSignersForKeypair({
    keypair: assertionMethod,
    id: `${fullDid.id}${fullDid.assertionMethod?.[0]}`,
  });
}

export const fullDidPromise = (async () => {
  await initKilt();

  if (configuration.storeDidAndCTypes) {
    if (
      configuration.did !== 'pending' &&
      (await DidResolver.resolve(configuration.did, {}))
    ) {
      logger.info('DID is already on the blockchain');
    } else {
      logger.warn('Storing DID on the blockchain');
      configuration.did = await createFullDid();
    }
  }

  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  const {
    didResolutionMetadata: { error },
    didDocument,
  } = await DidResolver.resolve(configuration.did, {});

  if (error || !didDocument) {
    throw new Error(
      `Could not resolve the own DID ${configuration.did}: ${error}`,
    );
  }

  await compareAllKeys(didDocument);
  const { keyAgreement, id, authentication } = didDocument;
  if (!keyAgreement) {
    throw new Error('Key agreement key not found');
  }

  const { authentication: authenticationKeypair } = await keypairsPromise;

  const signers = await Signers.getSignersForKeypair({
    keypair: authenticationKeypair,
    id: `${id}${authentication?.[0]}`,
  });

  return { fullDid: didDocument, keyAgreementKey: keyAgreement[0], signers };
})();

fullDidPromise.catch(exitOnError);
