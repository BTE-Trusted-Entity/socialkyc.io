import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlTwitch';

export async function authUrlTwitch(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.twitch.authUrl, { json }).text();
}
