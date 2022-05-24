import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';
import { pollingOptions } from '../../frontend/utilities/pollingOptions';

import { Input, Output } from './attestTelegram';

export async function attestTelegram(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.telegram.attest, { json, ...pollingOptions }).json();
}
