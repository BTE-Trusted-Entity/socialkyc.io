import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlGithub';

export async function authUrlGithub(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.github.authUrl, { json }).text();
}
