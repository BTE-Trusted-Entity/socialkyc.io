import ky from 'ky';

import { Input, Output } from './quoteEmail';
import { paths } from '../endpoints/paths';

export async function quoteEmail(input: Input): Promise<Output> {
  return ky.post(paths.email.quote, { json: input }).json();
}
