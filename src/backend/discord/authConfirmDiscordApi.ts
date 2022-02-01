import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './authConfirmDiscord';

export async function authConfirmDiscord(input: Input): Promise<Output> {
  return ky.post(paths.discord.authConfirm, { json: input }).json();
}
