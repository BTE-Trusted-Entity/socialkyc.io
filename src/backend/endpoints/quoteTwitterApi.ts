import ky from 'ky';

import { Input, Output } from './quoteTwitter';
import { paths } from './paths';

export async function quoteTwitter(json: Input): Promise<Output> {
  return ky.post(paths.quoteTwitter, { json }).json();
}
