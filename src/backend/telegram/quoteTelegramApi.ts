import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteTelegram';

export async function quoteTelegram(input: Input): Promise<Output> {
  return ky.post(paths.telegram.quote, { json: input }).json();
}
