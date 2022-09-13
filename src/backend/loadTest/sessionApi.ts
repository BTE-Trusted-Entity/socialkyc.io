import got from 'got';

import { paths } from '../endpoints/paths';
import { sessionHeader } from '../endpoints/sessionHeader';

import { GetSessionOutput } from '../endpoints/session';

import { configuration } from '../utilities/configuration';

import { CheckSessionInput } from './loadTest';

export async function getSessionFromEndpoint(): Promise<GetSessionOutput> {
  return got(`${configuration.baseUri}${paths.session}`).json();
}

export async function checkSession(
  encryptionChallenge: CheckSessionInput,
  sessionId: string,
) {
  await got
    .post(`${configuration.baseUri}${paths.session}`, {
      json: encryptionChallenge,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}
