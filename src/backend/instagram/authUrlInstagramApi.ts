import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlInstagram';

export async function authUrlInstagram(input: Input): Promise<Output> {
  return ky.post(paths.instagram.authUrl, { json: input }).text();
}
