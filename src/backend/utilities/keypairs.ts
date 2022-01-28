import { Keyring } from '@polkadot/keyring';
import { KeyRelationship, KeyringPair } from '@kiltprotocol/types';
import { DefaultResolver } from '@kiltprotocol/did';
import {
  blake2AsU8a,
  ed25519PairFromSeed,
  keyExtractPath,
  keyFromPath,
  mnemonicToMiniSecret,
  naclBoxPairFromSecret,
} from '@polkadot/util-crypto';

import { initKilt } from './initKilt';
import { configuration } from './configuration';
import { exitOnError } from './exitOnError';

const ss58Format = 38;

function makeKeyring(): Keyring {
  return new Keyring({
    type: 'sr25519',
    ss58Format,
  });
}

export function getKeypairByBackupPhrase(backupPhrase: string): KeyringPair {
  return makeKeyring().addFromUri(backupPhrase);
}

function getLegacyKeyAgreementKey(identity: KeyringPair) {
  const keyAgreement = naclBoxPairFromSecret(
    identity
      .derive('//did//keyAgreement//0')
      .encryptMessage(
        new Uint8Array(24).fill(0),
        new Uint8Array(24).fill(0),
        new Uint8Array(24).fill(0),
      )
      .slice(24), // first 24 bytes are the nonce
  );
  return {
    ...keyAgreement,
    type: 'x25519',
  };
}

async function useLegacy() {
  const { did } = configuration;
  const didDocument = await DefaultResolver.resolveDoc(did);
  if (!didDocument || !didDocument.details) {
    throw new Error(`Could not resolve ${did} after key upgrade`);
  }

  const existingKey = didDocument.details
    .getKeys(KeyRelationship.keyAgreement)
    .pop();
  if (!existingKey) {
    throw new Error('Key agreement key not found');
  }

  const legacyKey =
    '0xf2c90875e0630bd1700412341e5e9339a57d2fefdbba08de1cac8db5b4145f6e';
  const storedLegacyKey = existingKey.publicKeyHex === legacyKey;

  return storedLegacyKey && !configuration.storeDidAndCTypes;
}

export const keypairsPromise = (async () => {
  await initKilt();

  const { backupPhrase } = configuration;

  const identity = getKeypairByBackupPhrase(backupPhrase);
  const authentication = identity.derive('//did//0');
  const assertion = identity.derive('//did//assertion//0');

  const edKeypair = ed25519PairFromSeed(mnemonicToMiniSecret(backupPhrase));
  const { path } = keyExtractPath('//did//keyAgreement//0');
  const { secretKey } = keyFromPath(edKeypair, path, 'ed25519');
  const keyAgreement = {
    ...naclBoxPairFromSecret(blake2AsU8a(secretKey)),
    type: 'x25519',
  };

  return {
    identity,
    authentication,
    assertion,
    keyAgreement: (await useLegacy())
      ? getLegacyKeyAgreementKey(identity)
      : keyAgreement,
  };
})();

keypairsPromise.catch(exitOnError);
