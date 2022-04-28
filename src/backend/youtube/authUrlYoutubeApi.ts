import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlYoutube';

export async function authUrlYoutube(input: Input): Promise<Output> {
  return ky.post(paths.youtube.authUrl, { json: input }).text();
}
