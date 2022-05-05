import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteLinkedIn';

export async function quoteLinkedIn(input: Input): Promise<Output> {
  return ky.post(paths.linkedIn.quote, { json: input }).json();
}
