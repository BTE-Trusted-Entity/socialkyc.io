import ky from 'ky';

import { Input, Output } from './requestCredential';
import { paths } from './paths';

export async function requestCredential(input: Input): Promise<Output> {
  return ky.post(paths.requestCredential, { json: input }).json();
}
