import ky from 'ky';

import { Input, Output } from './confirmTwitter';
import { paths } from '../endpoints/paths';

const timeout = 5 * 60 * 1000;

export async function confirmTwitter(input: Input): Promise<Output> {
  return ky.post(paths.twitter.confirm, { json: input, timeout }).json();
}
