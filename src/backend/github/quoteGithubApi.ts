import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteGithub';

export async function quoteGithub(input: Input): Promise<Output> {
  return ky.post(paths.github.quote, { json: input }).json();
}
