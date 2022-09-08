import { ServerRoute } from '@hapi/hapi';
import { naclSeal, blake2AsU8a } from '@polkadot/util-crypto';
import { Crypto } from '@kiltprotocol/utils';

import got from 'got';

import {
  DidEncryptionKey,
  DidResourceUri,
  DidUri,
  IRequestAttestation,
  MessageBodyType,
} from '@kiltprotocol/types';

import { Claim, RequestForAttestation } from '@kiltprotocol/core';

import { DidDetails, FullDidDetails } from '@kiltprotocol/did';

import { Message } from '@kiltprotocol/messaging';

import { GetSessionOutput } from '../endpoints/session';
import {
  getKeystoreFromSeed,
  getTabEncryption,
} from '../utilities/getTabEncryption';
import { sessionHeader } from '../endpoints/sessionHeader';
import { Input, Output } from '../email/quoteEmail';
import {
  Input as ReqAttestationInput,
  Output as ReqAttestationOutput,
} from '../email/requestAttestationEmail';

import { emailCType } from '../email/emailCType';
import { encryptionKeystore } from '../utilities/keystores';

const { env } = process;

async function getSessionFromEndpoint(): Promise<GetSessionOutput> {
  return got.get('http://localhost:3000/api/session').json();
}

async function produceEncryptedChallenge(
  challenge: string,
  dAppEncryptionKeyUri: DidResourceUri,
) {
  const encryption = await getTabEncryption(dAppEncryptionKeyUri);
  const { dAppEncryptionDidKey, sporranEncryptionDidKeyUri } = encryption;

  const { sealed, nonce } = naclSeal(
    Crypto.coToUInt8(challenge),
    encryption.encryptionKey.secretKey,
    dAppEncryptionDidKey.publicKey,
  );

  return {
    encryptionKeyUri: sporranEncryptionDidKeyUri,
    encryptedChallenge: Crypto.u8aToHex(sealed),
    nonce: Crypto.u8aToHex(nonce),
  };
}

function getDidEncryptionKey(details: DidDetails): DidEncryptionKey {
  const { encryptionKey } = details;
  if (!encryptionKey) {
    throw new Error('encryptionKey is not defined somehow');
  }
  return encryptionKey;
}

async function performTest() {
  const { challenge, dAppEncryptionKeyUri, sessionId } =
    await getSessionFromEndpoint();

  const encryptionChallenge = await produceEncryptedChallenge(
    challenge,
    dAppEncryptionKeyUri,
  );

  await got
    .post('http://localhost:3000/api/session', {
      json: encryptionChallenge,
      headers: { [sessionHeader]: sessionId },
    })
    .json();

  await quoteEmailRequest({ email: 'xyzabc@vb.com' }, sessionId);

  const claim = Claim.fromCTypeAndClaimContents(
    emailCType,
    { Email: 'xyzabc@vb.com' },
    'did:kilt:4qsQ5sRVhbti5k9QU1Z1Wg932MwFboCmAdbSyR6GpavMkrr3',
  );

  const requestForAttestation = RequestForAttestation.fromClaim(claim);
  const seed = blake2AsU8a(
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
  const encryptedMsg = await message.encrypt(
    getDidEncryptionKey(didDetails).id,
    didDetails,
    encryptionKeystore,
    attesterDidDetails.assembleKeyUri(
      getDidEncryptionKey(attesterDidDetails).id,
    ),
  );

  return requestAttestationRequest(
    { message: encryptedMsg, wallet: 'sporran' },
    sessionId,
  );
}

async function quoteEmailRequest(
  json: Input,
  sessionId: string,
): Promise<Output> {
  return got
    .post('http://localhost:3000/api/email/quote', {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

async function requestAttestationRequest(
  json: ReqAttestationInput,
  sessionId: string,
): Promise<ReqAttestationOutput> {
  return got
    .post('http://localhost:3000/api/email/request-attestation', {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export const loadTest: ServerRoute = {
  method: 'GET',
  path: '/api/test',
  handler: () => performTest(),
};
