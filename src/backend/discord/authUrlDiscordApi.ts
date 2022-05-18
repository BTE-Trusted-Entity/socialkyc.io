import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlDiscord';

export async function authUrlDiscord(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.discord.authUrl, { json }).text();
}
