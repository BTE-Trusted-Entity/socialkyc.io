import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authUrlLinkedIn';

export async function authUrlLinkedIn(input: Input): Promise<Output> {
  return ky.post(paths.linkedIn.authUrl, { json: input }).text();
}
