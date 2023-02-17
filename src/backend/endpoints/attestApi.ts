import { KyInstance } from 'ky/distribution/types/ky';

import { pollingOptions } from '../../frontend/utilities/pollingOptions';

import { paths } from './paths';
import { Input, Output } from './attest';

export async function attest(json: Input, ky: KyInstance): Promise<Output> {
  return ky.post(paths.attest, { json, ...pollingOptions }).json();
}
