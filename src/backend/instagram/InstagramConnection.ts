import got, { HTTPError } from 'got';

import { trackConnectionState } from '../utilities/trackConnectionState';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { instagramEndpoints } from './instagramEndpoints';

export const twitchConnectionState = trackConnectionState(10 * 60 * 1000);

export async function canAccessTwitch() {
  try {
    await got
      .post(instagramEndpoints.token, {
        form: {
          client_id: configuration.instagram.clientId,
          client_secret: configuration.instagram.secret,
        },
      })
      .json();
  } catch (error) {
    if (error instanceof HTTPError && error.response.statusCode !== 403) {
      twitchConnectionState.on();
      return;
    }
    twitchConnectionState.off();
    logger.error(error, 'Error connecting to Twitch');
    throw error;
  }
}

export function checkTwitchConnection() {
  setInterval(async () => {
    try {
      await canAccessTwitch();
    } catch {}
  }, 5 * 60 * 1000);
}
