import {
  blake2AsU8a,
  ed25519PairFromSeed,
  keyExtractPath,
  keyFromPath,
  mnemonicToMiniSecret,
} from '@polkadot/util-crypto';

import { Crypto } from '@kiltprotocol/utils';

import { initKilt } from './initKilt';
import { configuration } from './configuration';
import { exitOnError } from './exitOnError';

export const keypairsPromise = (async () => {
  await initKilt();

  const { backupPhrase } = configuration;

  const identity = Crypto.makeKeypairFromUri(backupPhrase, 'sr25519');
  const authentication = Crypto.makeKeypairFromUri(
    `${backupPhrase}//did//0`,
    'sr25519',
  );
  const assertionMethod = Crypto.makeKeypairFromUri(
    `${backupPhrase}//did//assertion//0`,
    'sr25519',
  );

  const edKeypair = ed25519PairFromSeed(mnemonicToMiniSecret(backupPhrase));
  const { path } = keyExtractPath('//did//keyAgreement//0');
  const { secretKey } = keyFromPath(edKeypair, path, 'ed25519');
  const keyAgreement = Crypto.makeEncryptionKeypairFromSeed(
    blake2AsU8a(secretKey),
  );

  return {
    identity,
    authentication,
    assertionMethod,
    keyAgreement,
  };
})();

keypairsPromise.catch(exitOnError);
