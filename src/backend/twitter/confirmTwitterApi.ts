import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';
import { pollingOptions } from '../../frontend/utilities/pollingOptions';

import { Input, Output } from './confirmTwitter';

export async function confirmTwitter(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.twitter.confirm, { json, ...pollingOptions }).json();
}
