import ky from 'ky';

import { Input, Output } from './quoteDotsama';
import { paths } from '../endpoints/paths';

export async function quoteDotsama(input: Input): Promise<Output> {
  return ky.post(paths.dotsama.quote, { json: input }).json();
}
