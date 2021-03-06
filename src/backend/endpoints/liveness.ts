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
import {
  canAccessTwitch,
  checkTwitchConnection,
  twitchConnectionState,
} from '../twitch/twitchConnection';
import {
  canAccessYoutube,
  checkYoutubeConnection,
  youtubeConnectionState,
} from '../youtube/youtubeConnection';
import {
  canAccessInstagram,
  checkInstagramConnection,
  instagramConnectionState,
} from '../instagram/instagramConnection';
import { reportBalance } from '../utilities/reportBalance';
import {
  canAccessTelegram,
  checkTelegramConnection,
  telegramConnectionState,
} from '../telegram/telegramConnection';

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

  await canAccessTwitch();
  checkTwitchConnection();

  await canAccessTelegram();
  checkTelegramConnection();

  await canAccessYoutube();
  checkYoutubeConnection();
  await canAccessInstagram();
  checkInstagramConnection();
}

function handler() {
  const kiltOk = !blockchainConnectionState.isOffForTooLong();
  const twitterOk = !twitterConnectionState.isOffForTooLong();
  const sesOk = !sesConnectionState.isOffForTooLong();
  const discordOk = !discordConnectionState.isOffForTooLong();
  const githubOk = !githubConnectionState.isOffForTooLong();
  const twitchOk = !twitchConnectionState.isOffForTooLong();
  const telegramOk = !telegramConnectionState.isOffForTooLong();
  const youtubeOk = !youtubeConnectionState.isOffForTooLong();
  const instagramOk = !instagramConnectionState.isOffForTooLong();

  return (
    kiltOk &&
    twitterOk &&
    sesOk &&
    discordOk &&
    githubOk &&
    twitchOk &&
    telegramOk &&
    youtubeOk &&
    instagramOk
  );
}

export const liveness: ServerRoute = {
  method: 'GET',
  path: paths.liveness,
  options: { auth: false },
  handler,
};
