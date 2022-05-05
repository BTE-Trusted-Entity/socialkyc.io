import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmLinkedIn';

export async function confirmLinkedIn(input: Input): Promise<Output> {
  return ky.post(paths.linkedIn.confirm, { json: input }).json();
}
