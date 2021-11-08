import ky from 'ky';

import { Input, Output } from './requestCredential';
import { paths } from '../endpoints/paths';

export async function requestCredential(input: Input): Promise<Output> {
  return ky.post(paths.verifier.requestCredential, { json: input }).json();
}
