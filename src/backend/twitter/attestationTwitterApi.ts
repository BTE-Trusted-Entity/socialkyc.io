import ky from 'ky';

import { Input, Output } from './attestationTwitter';
import { paths } from '../endpoints/paths';

const timeout = 5 * 60 * 1000;

export async function attestTwitter(input: Input): Promise<Output> {
  return ky.post(paths.twitter.attest, { json: input, timeout }).json();
}
