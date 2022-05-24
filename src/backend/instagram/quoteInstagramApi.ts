import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteInstagram';

export async function quoteInstagram(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.instagram.quote, { json }).json();
}
