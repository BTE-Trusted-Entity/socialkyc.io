import { Keyring } from '@polkadot/keyring';
import { KeyringPair } from '@polkadot/keyring/types';
import { naclBoxKeypairFromSecret } from '@polkadot/util-crypto';

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
  const keyAgreement = naclBoxKeypairFromSecret(
    identity
      .derive('//did//keyAgreement//0')
      .sign('0123456789012345678901234567890123456789012345678901234567890123'),
  );

  return {
    identity,
    authentication,
    assertion,
    keyAgreement,
  };
})();
