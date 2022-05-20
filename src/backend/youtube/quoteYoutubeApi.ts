import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteYoutube';

export async function quoteYoutube(input: Input): Promise<Output> {
  return ky.post(paths.youtube.quote, { json: input }).json();
}
