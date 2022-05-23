import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';
import { pollingOptions } from '../../frontend/utilities/pollingOptions';

import { Input, Output } from './attestInstagram';

export async function attestInstagram(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.instagram.attest, { json, ...pollingOptions }).json();
}
