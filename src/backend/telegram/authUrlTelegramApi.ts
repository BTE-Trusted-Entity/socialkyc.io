import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlTelegram';

export async function authUrlTelegram(input: Input): Promise<Output> {
  return ky.post(paths.telegram.authUrl, { json: input }).text();
}
