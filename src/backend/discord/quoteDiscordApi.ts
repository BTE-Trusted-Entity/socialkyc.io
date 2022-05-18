import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteDiscord';

export async function quoteDiscord(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.discord.quote, { json }).json();
}
