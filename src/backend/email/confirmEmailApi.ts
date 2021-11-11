import ky from 'ky';

import { Input, Output } from './confirmEmail';
import { paths } from '../endpoints/paths';

export async function confirmEmail(input: Input): Promise<Output> {
  return ky.post(paths.email.confirm, { json: input }).json();
}
