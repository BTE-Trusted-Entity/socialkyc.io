import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteTwitch';

export async function quoteTwitch(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.twitch.quote, { json }).json();
}
