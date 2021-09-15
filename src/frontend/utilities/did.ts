import { Keyring } from '@polkadot/keyring';
import { LightDidDetails } from '@kiltprotocol/did';
import { KeyringPair } from '@polkadot/keyring/types';
import { IDidDetails } from '@kiltprotocol/types';

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

export function deriveDidAuthenticationKeypair(
  identityKeypair: KeyringPair,
): KeyringPair {
  return identityKeypair.derive('//did//0');
}

export function createLightDidDetails(backupPhrase: string): IDidDetails {
  const identityKeypair = getKeypairByBackupPhrase(backupPhrase);
  const authenticationKey = deriveDidAuthenticationKeypair(identityKeypair);
  const didDetails = new LightDidDetails({ authenticationKey });
  return didDetails;
}
