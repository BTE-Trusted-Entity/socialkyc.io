import got, { HTTPError } from 'got';

import { trackConnectionState } from '../utilities/trackConnectionState';
import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { instagramEndpoints } from './instagramEndpoints';

export const instagramConnectionState = trackConnectionState(10 * 60 * 1000);

function isInvalidCode(error: unknown) {
  return (
    error instanceof HTTPError &&
    JSON.parse(error.response.body as string).error_message ===
      'Invalid authorization code'
  );
}
export async function canAccessInstagram() {
  try {
    await got.post(instagramEndpoints.token, {
      form: {
        client_id: configuration.instagram.clientId,
        client_secret: configuration.instagram.secret,
        code: 'code',
        grant_type: 'authorization_code',
        redirect_uri: instagramEndpoints.redirectUri,
      },
    });
    instagramConnectionState.on();
  } catch (error) {
    if (isInvalidCode(error)) {
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
