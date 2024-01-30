import type { DidUrl } from '@kiltprotocol/types';
import type { IEncryptedMessage } from '@kiltprotocol/extension-api/types';

import got from 'got';

import { Challenge } from './loadTest';

const sessionHeader = 'x-session-id';

const api = got.extend({ prefixUrl: process.env.URL });

export async function getSessionFromEndpoint(): Promise<{
  dAppEncryptionKeyUri: DidUrl;
  sessionId: string;
  challenge: string;
}> {
  return api('api/session').json();
}

export async function checkSession(
  encryptionChallenge: Challenge,
  sessionId: string,
) {
  await api
    .post('api/session', {
      json: encryptionChallenge,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export async function getSecretApi(
  json: Record<string, never>,
  sessionId: string,
): Promise<{ secret: string }> {
  return api
    .post('api/test/secret', {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export async function sendEmailApi(
  json: {
    email: string;
    wallet: string;
  },
  sessionId: string,
): Promise<string> {
  return api
    .post('api/email/send', {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .text();
}

export async function confirmEmailApi(
  json: { secret: string },
  sessionId: string,
): Promise<void> {
  return api
    .post('api/email/confirm', {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export async function quoteEmailApi(
  json: {
    email: string;
  },
  sessionId: string,
): Promise<IEncryptedMessage> {
  return api
    .post('api/email/quote', {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export async function requestAttestationApi(
  json: {
    message: IEncryptedMessage;
    wallet: string;
  },
  sessionId: string,
): Promise<void> {
  return api
    .post('api/email/request-attestation', {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export async function attestEmailApi(
  json: Record<string, never>,
  sessionId: string,
): Promise<IEncryptedMessage> {
  return api
    .post('api/email/attest', {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}
