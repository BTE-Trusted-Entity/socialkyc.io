import got from 'got';

import { trackConnectionState } from '../utilities/trackConnectionState';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { discordEndpoints } from './discordEndpoints';

export const discordConnectionState = trackConnectionState(10 * 60 * 1000);

export async function canAccessDiscord() {
  try {
    await got
      .post(discordEndpoints.token, {
        form: {
          grant_type: 'client_credentials',
          scope: 'identify',
        },
        username: configuration.discord.clientId,
        password: configuration.discord.clientSecret,
      })
      .json();
    discordConnectionState.on();
  } catch (error) {
    discordConnectionState.off();
    logger.error(error, 'Error connecting to Discord');
    throw error;
  }
}

export function checkDiscordConnection() {
  setInterval(
    async () => {
      try {
        await canAccessDiscord();
      } catch {}
    },
    5 * 60 * 1000,
  );
}
