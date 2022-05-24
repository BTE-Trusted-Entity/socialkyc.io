import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmGithub';

export async function confirmGithub(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.github.confirm, { json }).json();
}
