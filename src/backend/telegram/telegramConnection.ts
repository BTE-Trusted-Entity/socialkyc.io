import got from 'got';

import { trackConnectionState } from '../utilities/trackConnectionState';
import { logger } from '../utilities/logger';
import { makeControlledPromise } from '../utilities/makeControlledPromise';

import { telegramEndpoints } from './telegramEndpoints';

export const botUsername = makeControlledPromise<string>();

export const telegramConnectionState = trackConnectionState(10 * 60 * 1000);

export async function canAccessTelegram() {
  try {
    const result = (await got(telegramEndpoints.botProfile).json()) as {
      ok: boolean;
      result: { username: string };
    };
    if (!result.ok) {
      throw result;
    }

    botUsername.resolve(result.result.username);

    telegramConnectionState.on();
  } catch (error) {
    telegramConnectionState.off();
    logger.error(error, 'Error connecting to Telegram');
    throw error;
  }
}

export function checkTelegramConnection() {
  setInterval(
    async () => {
      try {
        await canAccessTelegram();
      } catch {}
    },
    5 * 60 * 1000,
  );
}
