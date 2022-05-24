import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteTelegram';

export async function quoteTelegram(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.telegram.quote, { json }).json();
}
