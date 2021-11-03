import ky from 'ky';

import { Input, Output } from './confirmTwitter';
import { paths } from './paths';

const timeout = 5 * 60 * 1000;

export async function confirmTwitter(input: Input): Promise<Output> {
  return ky.post(paths.confirmTwitter, { json: input, timeout }).json();
}
