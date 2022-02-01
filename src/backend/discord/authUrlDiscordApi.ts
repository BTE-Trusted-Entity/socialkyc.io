import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlDiscord';

export async function authUrlDiscord(input: Input): Promise<Output> {
  return ky.post(paths.discord.auth, { json: input }).text();
}
