import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmEmail';

export async function confirmEmail(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.email.confirm, { json }).json();
}
