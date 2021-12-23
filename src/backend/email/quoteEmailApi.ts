import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteEmail';

export async function quoteEmail(input: Input): Promise<Output> {
  return ky.post(paths.email.quote, { json: input }).json();
}
