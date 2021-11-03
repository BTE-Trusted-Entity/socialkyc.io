import ky from 'ky';

import { Input, Output } from './attestationTwitter';
import { paths } from './paths';

const timeout = 5 * 60 * 1000;

export async function attestTwitter(input: Input): Promise<Output> {
  return ky.post(paths.attestTwitter, { json: input, timeout }).json();
}
