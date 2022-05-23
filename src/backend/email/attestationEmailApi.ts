import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';
import { pollingOptions } from '../../frontend/utilities/pollingOptions';

import { Input, Output } from './attestationEmail';

export async function attestEmail(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.email.attest, { json, ...pollingOptions }).json();
}
