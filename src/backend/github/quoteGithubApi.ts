import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteGithub';

export async function quoteGithub(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.github.quote, { json }).json();
}
