import got from 'got';

import { trackConnectionState } from '../utilities/trackConnectionState';
import { sleep } from '../utilities/sleep';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { githubEndpoints } from './githubEndpoints';

export const githubConnectionState = trackConnectionState(10 * 60 * 1000);

export async function canAccessGitHub() {
  try {
    await got
      .post(githubEndpoints.token, {
        form: {},
        username: configuration.github.clientId,
        password: configuration.github.secret,
      })
      .json();
    githubConnectionState.on();
  } catch (error) {
    githubConnectionState.off();
    logger.error(error, 'Error connecting to GitHub');
    throw error;
  }
}

export async function noAwaitCheckGitHubConnection() {
  while (true) {
    await sleep(5 * 60 * 1000);
    try {
      await canAccessGitHub();
    } catch {}
  }
}
