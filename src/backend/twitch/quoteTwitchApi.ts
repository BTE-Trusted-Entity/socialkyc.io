import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteTwitch';

export async function quoteTwitch(input: Input): Promise<Output> {
  return ky.post(paths.twitch.quote, { json: input }).json();
}
