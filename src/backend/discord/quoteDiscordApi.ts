import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteDiscord';

export async function quoteDiscord(input: Input): Promise<Output> {
  return ky.post(paths.discord.quote, { json: input }).json();
}
