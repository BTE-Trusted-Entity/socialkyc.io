import { ServerRoute } from '@hapi/hapi';

import {
  initKilt,
  reConnect,
  blockchainConnectionState,
} from '../utilities/initKilt';
import { canAccessTwitter, twitterConnectionState } from '../twitter/tweets';
import {
  canAccessAmazonSES,
  noAwaitCheckSesConnection,
  sesConnectionState,
} from '../email/sesConnection';
import {
  canAccessDiscord,
  discordConnectionState,
  noAwaitCheckDiscordConnection,
} from '../discord/discordConnection';
import {
  canAccessGitHub,
  githubConnectionState,
  noAwaitCheckGitHubConnection,
} from '../github/githubConnection';
import { noAwaitReportBalance } from '../utilities/noAwaitReportBalance';

import { paths } from './paths';

export async function testLiveness() {
  await initKilt();
  await reConnect();
  noAwaitReportBalance();

  await canAccessTwitter();

  await canAccessDiscord();
  noAwaitCheckDiscordConnection();

  await canAccessAmazonSES();
  noAwaitCheckSesConnection();

  await canAccessGitHub();
  noAwaitCheckGitHubConnection();
}

function handler() {
  const kiltOk = !blockchainConnectionState.offForTooLong();
  const twitterOk = !twitterConnectionState.offForTooLong();
  const sesOk = !sesConnectionState.offForTooLong();
  const discordOk = !discordConnectionState.offForTooLong();
  const githubOk = !githubConnectionState.offForTooLong();
  return kiltOk && twitterOk && sesOk && discordOk && githubOk;
}

export const liveness: ServerRoute = {
  method: 'GET',
  path: paths.liveness,
  options: { auth: false },
  handler,
};
