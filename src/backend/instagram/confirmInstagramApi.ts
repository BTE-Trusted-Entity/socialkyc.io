import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmInstagram';

export async function confirmInstagram(input: Input): Promise<Output> {
  return ky.post(paths.instagram.confirm, { json: input }).json();
}
