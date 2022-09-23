import {
  ed25519PairFromRandom,
  naclBoxPairFromSecret,
  naclOpen,
  naclSeal,
} from '@polkadot/util-crypto';

import { Keypair } from '@polkadot/util-crypto/types';

import {
  DidEncryptionKey,
  DidResourceUri,
  EncryptionKeyType,
  IEncryptedMessage,
  IMessage,
  KeystoreSigner,
  MessageBody,
  NaclBoxCapable,
  ResolvedDidKey,
  VerificationKeyType,
} from '@kiltprotocol/types';

import { KeyringPair } from '@polkadot/keyring/types';

import { DidDetails, DidResolver, LightDidDetails } from '@kiltprotocol/did';

import { Keyring } from '@polkadot/keyring';

import { Message } from '@kiltprotocol/messaging';

interface MessageEncryption {
  authenticationKey: KeyringPair;
  encryptionKey: Keypair;
  sporranEncryptionDidKeyUri: DidResourceUri;
  dAppEncryptionDidKey: ResolvedDidKey;
  decrypt: (encrypted: IEncryptedMessage) => Promise<IMessage>;
  encrypt: (messageBody: MessageBody) => Promise<IEncryptedMessage>;
}

const ss58Format = 38;

export function makeKeystore({
  secretKey,
}: Keypair): Pick<NaclBoxCapable, 'decrypt' | 'encrypt'> {
  return {
    async decrypt({ data, alg, nonce, peerPublicKey }) {
      const decrypted = naclOpen(data, nonce, peerPublicKey, secretKey);
      if (!decrypted) {
        throw new Error('Failed to decrypt with given key');
      }

      return {
        data: decrypted,
        alg,
      };
    },
    async encrypt({ data, alg, peerPublicKey }) {
      const { sealed, nonce } = naclSeal(data, secretKey, peerPublicKey);

      return {
        data: sealed,
        alg,
        nonce,
      };
    },
  };
}

function getDidEncryptionKey(details: DidDetails): DidEncryptionKey {
  const { encryptionKey } = details;
  if (!encryptionKey) {
    throw new Error('encryptionKey is not defined somehow');
  }
  return encryptionKey;
}

function makeKeyring(): Keyring {
  return new Keyring({
    type: 'sr25519',
    ss58Format,
  });
}

export async function getMessageEncryption(
  dAppEncryptionKeyUri: DidResourceUri,
): Promise<MessageEncryption> {
  if (!dAppEncryptionKeyUri) {
    throw new Error('Cannot generate encryption outside challenge flow');
  }

  const encryptionKey = {
    ...naclBoxPairFromSecret(ed25519PairFromRandom().secretKey),
    type: EncryptionKeyType.X25519,
  };
  const authenticationKey = makeKeyring()
    .addFromSeed(encryptionKey.secretKey.slice(0, 32))
    .derive('//authentication');

  const keystore = makeKeystore(encryptionKey);

  const sporranDidDetails = LightDidDetails.fromDetails({
    authenticationKey: {
      ...authenticationKey,
      type: VerificationKeyType.Sr25519,
    },
    encryptionKey,
  });
  const sporranEncryptionDidKey = getDidEncryptionKey(sporranDidDetails);
  const sporranEncryptionDidKeyUri = sporranDidDetails.assembleKeyUri(
    sporranEncryptionDidKey.id,
  );

  const dAppEncryptionDidKey = (await DidResolver.resolveKey(
    dAppEncryptionKeyUri,
  )) as ResolvedDidKey;
  if (!dAppEncryptionDidKey) {
    throw new Error('Receiver key agreement key not found');
  }

  const dAppDid = dAppEncryptionDidKey.controller;

  async function decrypt(encrypted: IEncryptedMessage): Promise<IMessage> {
    return Message.decrypt(encrypted, keystore, sporranDidDetails);
  }

  async function encrypt(messageBody: MessageBody): Promise<IEncryptedMessage> {
    const message = new Message(messageBody, sporranDidDetails.uri, dAppDid);
    return message.encrypt(
      sporranEncryptionDidKey.id,
      sporranDidDetails,
      keystore,
      dAppEncryptionKeyUri as DidResourceUri,
    );
  }

  return {
    authenticationKey,
    encryptionKey,
    sporranEncryptionDidKeyUri,
    dAppEncryptionDidKey,
    decrypt,
    encrypt,
  };
}

function getKeypairBySeed(seed: Uint8Array): KeyringPair {
  return makeKeyring().addFromSeed(seed);
}

function deriveAuthenticationKey(seed: Uint8Array): KeyringPair {
  return getKeypairBySeed(seed).derive('//did//0');
}

export async function getKeystoreFromSeed(
  seed: Uint8Array,
): Promise<KeystoreSigner> {
  const authenticationKey = deriveAuthenticationKey(seed);
  return {
    sign: async ({ data, alg }) => ({
      data: authenticationKey.sign(data, { withType: false }),
      alg,
    }),
  };
}
