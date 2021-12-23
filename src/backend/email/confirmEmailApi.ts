import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmEmail';

export async function confirmEmail(input: Input): Promise<Output> {
  return ky.post(paths.email.confirm, { json: input }).json();
}
