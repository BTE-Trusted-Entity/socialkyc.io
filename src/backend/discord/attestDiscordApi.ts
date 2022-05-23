import { KyInstance } from 'ky/distribution/types/ky';

import { paths } from '../endpoints/paths';
import { pollingOptions } from '../../frontend/utilities/pollingOptions';

import { Input, Output } from './attestDiscord';

export async function attestDiscord(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(paths.discord.attest, { json, ...pollingOptions }).json();
}
