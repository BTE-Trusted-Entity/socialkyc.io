import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteEmail';

export async function quoteEmail(json: Input, ky: KyInstance): Promise<Output> {
  return ky.post(paths.email.quote, { json }).json();
}
