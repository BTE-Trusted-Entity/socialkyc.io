import { ServerRoute } from '@hapi/hapi';

import {
  initKilt,
  connect,
  blockchainConnectionState,
} from '../utilities/initKilt';
import { canAccessTwitter, twitterConnectionState } from '../twitter/tweets';
import {
  canAccessAmazonSES,
  checkSesConnection,
  sesConnectionState,
} from '../email/sesConnection';
import {
  canAccessDiscord,
  discordConnectionState,
  checkDiscordConnection,
} from '../discord/discordConnection';
import {
  canAccessGitHub,
  githubConnectionState,
  checkGitHubConnection,
} from '../github/githubConnection';
import { reportBalance } from '../utilities/reportBalance';

import { paths } from './paths';

export async function testLiveness() {
  await initKilt();
  await connect();
  reportBalance();

  await canAccessTwitter();

  await canAccessDiscord();
  checkDiscordConnection();

  await canAccessAmazonSES();
  checkSesConnection();

  await canAccessGitHub();
  checkGitHubConnection();
}

function handler() {
  const kiltOk = !blockchainConnectionState.isOffForTooLong();
  const twitterOk = !twitterConnectionState.isOffForTooLong();
  const sesOk = !sesConnectionState.isOffForTooLong();
  const discordOk = !discordConnectionState.isOffForTooLong();
  const githubOk = !githubConnectionState.isOffForTooLong();
  return kiltOk && twitterOk && sesOk && discordOk && githubOk;
}

export const liveness: ServerRoute = {
  method: 'GET',
  path: paths.liveness,
  options: { auth: false },
  handler,
};
