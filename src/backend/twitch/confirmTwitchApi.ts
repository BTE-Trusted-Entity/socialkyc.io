import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmTwitch';

export async function confirmTwitch(input: Input): Promise<Output> {
  return ky.post(paths.twitch.confirm, { json: input }).json();
}
