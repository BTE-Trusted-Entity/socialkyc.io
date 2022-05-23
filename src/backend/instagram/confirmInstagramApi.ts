import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmInstagram';

export async function confirmInstagram(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.instagram.confirm, { json }).json();
}
