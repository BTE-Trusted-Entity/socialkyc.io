import type { KyInstance } from 'ky/distribution/types/ky';

import type { SupportedCType } from '../utilities/supportedCType';

import { Input } from './confirm';
import { generatePath, paths } from './paths';

export async function confirm(
  type: SupportedCType,
  json: Input,
  ky: KyInstance,
) {
  const url = generatePath(paths.confirm, type);
  return ky.post(url, { json }).json();
}
