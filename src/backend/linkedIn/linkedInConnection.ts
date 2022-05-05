import got, { HTTPError } from 'got';

import { trackConnectionState } from '../utilities/trackConnectionState';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { linkedInEndpoints } from './linkedInEndpoints';

export const linkedInConnectionState = trackConnectionState(10 * 60 * 1000);

export async function canAccessLinkedIn() {
  try {
    await got
      .post(linkedInEndpoints.token, {
        form: {
          grant_type: 'client_credentials',
          client_id: configuration.linkedIn.clientId,
          client_secret: configuration.linkedIn.secret,
        },
      })
      .json();
    linkedInConnectionState.on();
  } catch (error) {
    if (
      error instanceof HTTPError &&
      !error.response.statusCode.toString().match(/^5/)
    ) {
      linkedInConnectionState.on();
      return;
    }
    linkedInConnectionState.off();
    logger.error(error, 'Error connecting to LinkedIn');
    throw error;
  }
}

export function checkLinkedInConnection() {
  setInterval(async () => {
    try {
      await canAccessLinkedIn();
    } catch {}
  }, 5 * 60 * 1000);
}
