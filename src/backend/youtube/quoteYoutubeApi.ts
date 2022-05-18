import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteYoutube';

export async function quoteYoutube(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.youtube.quote, { json }).json();
}
