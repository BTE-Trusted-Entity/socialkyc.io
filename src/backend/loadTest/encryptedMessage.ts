import { Claim, RequestForAttestation } from '@kiltprotocol/core';
import { DidDetails, FullDidDetails } from '@kiltprotocol/did';
import { Message } from '@kiltprotocol/messaging';
import {
  DidEncryptionKey,
  DidUri,
  EncryptionKeyType,
  IRequestAttestation,
  MessageBodyType,
  NaclBoxCapable,
} from '@kiltprotocol/types';
import {
  blake2AsU8a,
  keyExtractPath,
  keyFromPath,
  mnemonicToMiniSecret,
  naclBoxPairFromSecret,
  naclSeal,
  sr25519PairFromSeed,
} from '@polkadot/util-crypto';

import { getKeystoreFromSeed } from './getMessageEncryption';

const { env } = process;

function getDidEncryptionKey(details: DidDetails): DidEncryptionKey {
  const { encryptionKey } = details;

  if (!encryptionKey) {
    throw new Error('encryptionKey is not defined somehow');
  }

  return encryptionKey;
}

export async function getEncryptedMessage(claim: Claim) {
  const requestForAttestation = RequestForAttestation.fromClaim(claim);
  const seed = mnemonicToMiniSecret(
    'turtle mother mechanic bacon uncover acoustic prison buyer frog wool castle error',
  );
  const keystore = await getKeystoreFromSeed(seed);
  const didDetails = await FullDidDetails.fromChainInfo(
    'did:kilt:4qsQ5sRVhbti5k9QU1Z1Wg932MwFboCmAdbSyR6GpavMkrr3',
  );

  if (!didDetails) throw new Error('No DID Details');

  await requestForAttestation.signWithDidKey(
    keystore,
    didDetails,
    didDetails.authenticationKey.id,
  );

  const requestForAttestationBody: IRequestAttestation = {
    content: { requestForAttestation },
    type: MessageBodyType.REQUEST_ATTESTATION,
  };

  const attesterDidDetails = await FullDidDetails.fromChainInfo(
    env.DID as DidUri,
  );

  if (!attesterDidDetails) throw new Error('No DID Details');

  const message = new Message(
    requestForAttestationBody,
    didDetails.uri,
    attesterDidDetails.uri,
  );

  const encryptionKeyExtension = deriveEncryptionKeyFromSeed(seed);

  const encryptionKeystoreExtension: Pick<NaclBoxCapable, 'encrypt'> = {
    async encrypt({ data, alg, peerPublicKey }) {
      const { sealed, nonce } = naclSeal(
        data,
        encryptionKeyExtension.secretKey,
        peerPublicKey,
      );

      return {
        data: sealed,
        alg,
        nonce,
      };
    },
  };

  const encryptedMsg = await message.encrypt(
    getDidEncryptionKey(didDetails).id,
    didDetails,
    encryptionKeystoreExtension,
    attesterDidDetails.assembleKeyUri(
      getDidEncryptionKey(attesterDidDetails).id,
    ),
  );
  return encryptedMsg;
}
export function deriveEncryptionKeyFromSeed(seed: Uint8Array): {
  type: EncryptionKeyType;
  publicKey: Uint8Array;
  secretKey: Uint8Array;
} {
  const keypair = sr25519PairFromSeed(seed);
  const { path } = keyExtractPath('//did//keyAgreement//0');
  const { secretKey } = keyFromPath(keypair, path, 'sr25519');
  return {
    ...naclBoxPairFromSecret(blake2AsU8a(secretKey)),
    type: EncryptionKeyType.X25519,
  };
}
