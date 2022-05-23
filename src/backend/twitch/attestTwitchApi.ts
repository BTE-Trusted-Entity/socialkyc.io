import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';
import { pollingOptions } from '../../frontend/utilities/pollingOptions';

import { Input, Output } from './attestTwitch';

export async function attestTwitch(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.twitch.attest, { json, ...pollingOptions }).json();
}
