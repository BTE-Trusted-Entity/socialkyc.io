import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteInstagram';

export async function quoteInstagram(input: Input): Promise<Output> {
  return ky.post(paths.instagram.quote, { json: input }).json();
}
