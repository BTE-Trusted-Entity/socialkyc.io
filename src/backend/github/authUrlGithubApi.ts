import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlGithub';

export async function authUrlGithub(input: Input): Promise<Output> {
  return ky.post(paths.github.authUrl, { json: input }).text();
}
