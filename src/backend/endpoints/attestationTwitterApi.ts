import ky from 'ky';

import { Input, Output } from './attestationTwitter';
import { paths } from './paths';

export async function attestTwitter(input: Input): Promise<Output> {
  return ky.post(paths.attestTwitter, { json: input }).json();
}
