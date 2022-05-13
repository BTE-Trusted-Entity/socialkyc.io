import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmSteam';

export async function confirmSteam(input: Input): Promise<Output> {
  return ky.post(paths.steam.confirm, { json: input }).json();
}
