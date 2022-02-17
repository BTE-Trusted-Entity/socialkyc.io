import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmGithub';

export async function confirmGithub(input: Input): Promise<Output> {
  return ky.post(paths.github.confirm, { json: input }).json();
}
