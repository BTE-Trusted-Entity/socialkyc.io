import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmTelegram';

export async function confirmTelegram(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.telegram.confirm, { json }).json();
}
