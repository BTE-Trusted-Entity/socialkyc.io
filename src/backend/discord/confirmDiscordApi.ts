import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmDiscord';

export async function confirmDiscord(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.discord.confirm, { json }).json();
}
