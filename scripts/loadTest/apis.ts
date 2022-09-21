import got from 'got';

import { DidResourceUri, IEncryptedMessage } from '@kiltprotocol/types';

import { CheckSessionInput } from './test';

const sessionHeader = 'x-session-id';

const paths = {
  email: {
    quote: '/api/email/quote',
    confirm: '/api/email/confirm',
    requestAttestation: '/api/email/request-attestation',
    attest: '/api/email/attest',
  },
  redirect: {
    email: '/email/auth',
  },
  session: '/api/session',
  test: {
    secret: '/api/test/secret',
  },
};

export async function getSessionFromEndpoint(): Promise<{
  dAppEncryptionKeyUri: DidResourceUri;
  sessionId: string;
  challenge: string;
}> {
  return got(`${process.env.URL}${paths.session}`).json();
}

export async function checkSession(
  encryptionChallenge: CheckSessionInput,
  sessionId: string,
) {
  await got
    .post(`${process.env.URL}${paths.session}`, {
      json: encryptionChallenge,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export async function getSecretApi(
  json: Record<string, never>,
  sessionId: string,
): Promise<{ secret: string }> {
  return got
    .post(`${process.env.URL}${paths.test.secret}`, {
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
  return got
    .post(`${process.env.URL}${paths.email.quote}`, {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export async function authEmailApi(state: string): Promise<string> {
  return got(`${process.env.URL}${paths.redirect.email}`, {
    searchParams: { state },
  }).text();
}

export async function requestAttestationApi(
  json: {
    message: IEncryptedMessage;
    wallet: string;
  },
  sessionId: string,
): Promise<void> {
  return got
    .post(`${process.env.URL}${paths.email.requestAttestation}`, {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export async function confirmEmailApi(
  json: { secret: string },
  sessionId: string,
): Promise<void> {
  return got
    .post(`${process.env.URL}${paths.email.confirm}`, {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}

export async function attestEmailApi(
  json: Record<string, never>,
  sessionId: string,
): Promise<IEncryptedMessage> {
  return got
    .post(`${process.env.URL}${paths.email.attest}`, {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}
