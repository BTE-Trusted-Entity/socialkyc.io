import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlTelegram';

export async function authUrlTelegram(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.telegram.authUrl, { json }).text();
}
