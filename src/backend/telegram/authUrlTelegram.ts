import { configuration } from '../utilities/configuration';

import { telegramEndpoints } from './telegramEndpoints';
import { botUsername } from './telegramConnection';

export async function authUrlTelegram(): Promise<string> {
  const searchParams = {
    size: 'medium',
    origin: configuration.baseUri,
  };

  const url = new URL(
    `${telegramEndpoints.authorize}/${await botUsername.promise}`,
  );
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString();
}
