import ky from 'ky';

import { Input, Output } from './quoteEmail';
import { paths } from './paths';

export async function quoteEmail(input: Input): Promise<Output> {
  return ky.post(paths.quoteEmail, { json: input }).json();
}
