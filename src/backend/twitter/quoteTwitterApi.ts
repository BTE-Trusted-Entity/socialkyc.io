import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteTwitter';

export async function quoteTwitter(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.twitter.quote, { json }).json();
}
