import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmTwitch';

export async function confirmTwitch(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.twitch.confirm, { json }).json();
}
