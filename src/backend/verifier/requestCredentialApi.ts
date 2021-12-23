import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './requestCredential';

export async function requestCredential(input: Input): Promise<Output> {
  return ky.post(paths.verifier.requestCredential, { json: input }).json();
}
