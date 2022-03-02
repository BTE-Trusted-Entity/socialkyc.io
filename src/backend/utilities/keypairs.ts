import { Keyring } from '@polkadot/keyring';
import { KeyringPair, EncryptionKeyType } from '@kiltprotocol/types';
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
    type: EncryptionKeyType.X25519,
  };

  return {
    identity,
    authentication,
    assertion,
    keyAgreement,
  };
})();

keypairsPromise.catch(exitOnError);
