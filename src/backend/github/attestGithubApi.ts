import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';
import { pollingOptions } from '../../frontend/utilities/pollingOptions';

import { Input, Output } from './attestGithub';

export async function attestGithub(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.github.attest, { json, ...pollingOptions }).json();
}
