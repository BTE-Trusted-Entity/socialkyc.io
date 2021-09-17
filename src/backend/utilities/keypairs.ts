import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';

import { initKilt } from './initKilt';
import { configuration } from './configuration';

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

  const identity = getKeypairByBackupPhrase(configuration.backupPhrase);
  const authentication = identity.derive('//did//0');
  const assertion = identity.derive('//did//assertion//0');

  return {
    identity,
    authentication,
    assertion,
  };
})();
