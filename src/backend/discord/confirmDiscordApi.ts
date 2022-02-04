import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmDiscord';

export async function confirmDiscord(input: Input): Promise<Output> {
  return ky.post(paths.discord.confirm, { json: input }).json();
}
