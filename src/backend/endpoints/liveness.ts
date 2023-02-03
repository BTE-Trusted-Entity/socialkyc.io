import { ServerRoute } from '@hapi/hapi';

import { initKilt, blockchainConnectionState } from '../utilities/initKilt';
//import { canAccessTwitter, twitterConnectionState } from '../twitter/tweets';
import { canAccessTwitter } from '../twitter/tweets';
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
import { reportBalance } from '../utilities/reportBalance';
import {
  canAccessTelegram,
  checkTelegramConnection,
  telegramConnectionState,
} from '../telegram/telegramConnection';

import { paths } from './paths';

export async function testLiveness() {
  await initKilt();
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
}

function handler() {
  const kiltOk = !blockchainConnectionState.isOffForTooLong();
  // const twitterOk = !twitterConnectionState.isOffForTooLong();
  const sesOk = !sesConnectionState.isOffForTooLong();
  const discordOk = !discordConnectionState.isOffForTooLong();
  const githubOk = !githubConnectionState.isOffForTooLong();
  const twitchOk = !twitchConnectionState.isOffForTooLong();
  const telegramOk = !telegramConnectionState.isOffForTooLong();
  const youtubeOk = !youtubeConnectionState.isOffForTooLong();

  return (
    kiltOk &&
    //twitterOk &&
    sesOk &&
    discordOk &&
    githubOk &&
    twitchOk &&
    telegramOk &&
    youtubeOk
  );
}

export const liveness: ServerRoute = {
  method: 'GET',
  path: paths.liveness,
  options: { auth: false },
  handler,
};
