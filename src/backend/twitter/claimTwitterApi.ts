import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './claimTwitter';

export async function claimTwitter(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.twitter.claim, { json }).text();
}
