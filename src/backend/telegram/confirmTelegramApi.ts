import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmTelegram';

export async function confirmTelegram(input: Input): Promise<Output> {
  return ky.post(paths.telegram.confirm, { json: input }).json();
}
