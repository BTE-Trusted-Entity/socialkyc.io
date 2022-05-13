import got, { HTTPError } from 'got';

import { trackConnectionState } from '../utilities/trackConnectionState';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { instagramEndpoints } from './instagramEndpoints';

export const instagramConnectionState = trackConnectionState(10 * 60 * 1000);

export async function canAccessInstagram() {
  try {
    await got
      .post(instagramEndpoints.token, {
        form: {
          client_id: configuration.instagram.clientId,
          client_secret: configuration.instagram.secret,
        },
      })
      .json();
    instagramConnectionState.on();
  } catch (error) {
    if (error instanceof HTTPError && error.response.statusCode < 500) {
      instagramConnectionState.on();
      return;
    }
    instagramConnectionState.off();
    logger.error(error, 'Error connecting to Instagram');
    throw error;
  }
}

export function checkInstagramConnection() {
  setInterval(async () => {
    try {
      await canAccessInstagram();
    } catch {}
  }, 5 * 60 * 1000);
}
