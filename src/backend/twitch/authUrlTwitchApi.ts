import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlTwitch';

export async function authUrlTwitch(input: Input): Promise<Output> {
  return ky.post(paths.twitch.authUrl, { json: input }).text();
}
