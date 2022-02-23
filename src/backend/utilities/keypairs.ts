import { Keyring } from '@polkadot/keyring';
import { IIdentity, KeyringPair } from '@kiltprotocol/types';
import { Balance, BalanceUtils } from '@kiltprotocol/core';
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
import { logger } from './logger';

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

async function reportBalance(address: IIdentity['address']) {
  const balances = await Balance.getBalances(address);

  const free = BalanceUtils.formatKiltBalance(balances.free);
  const reserved = BalanceUtils.formatKiltBalance(balances.reserved);

  logger.info(`Free: ${free}, bonded: ${reserved}`);
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

  await reportBalance(identity.address);

  return {
    identity,
    authentication,
    assertion,
    keyAgreement,
  };
})();

keypairsPromise.catch(exitOnError);
