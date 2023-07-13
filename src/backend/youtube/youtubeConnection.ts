import got, { HTTPError } from 'got';

import { trackConnectionState } from '../utilities/trackConnectionState';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { youtubeEndpoints } from './youtubeEndpoints';

export const youtubeConnectionState = trackConnectionState(10 * 60 * 1000);

export async function canAccessYoutube() {
  try {
    await got
      .post(youtubeEndpoints.token, {
        form: {
          code: '4/P7q7W91a-sample-IaQm6bergtp8',
          grant_type: 'authorization_code',
          client_id: configuration.youtube.clientId,
          client_secret: configuration.youtube.clientSecret,
        },
      })
      .json();
  } catch (error) {
    if (error instanceof HTTPError && error.response.statusCode !== 401) {
      youtubeConnectionState.on();
      return;
    }
    youtubeConnectionState.off();
    logger.error(error, 'Error connecting to Youtube');
    throw error;
  }
}

export function checkYoutubeConnection() {
  setInterval(
    async () => {
      try {
        await canAccessYoutube();
      } catch {}
    },
    5 * 60 * 1000,
  );
}
