import ky from 'ky';

import { paths } from '../endpoints/paths';

import { Input, Output } from './quoteTwitter';

export async function quoteTwitter(json: Input): Promise<Output> {
  return ky.post(paths.twitter.quote, { json }).json();
}
