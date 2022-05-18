import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';
import { pollingOptions } from '../../frontend/utilities/pollingOptions';

import { Input, Output } from './attestYoutube';

export async function attestYoutube(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.youtube.attest, { json, ...pollingOptions }).json();
}
