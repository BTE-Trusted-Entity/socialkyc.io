import { KyInstance } from 'ky/distribution/types/ky';

import { SupportedCTypes } from '../utilities/supportedCTypes';

import { Input } from './confirm';
import { generatePath, paths } from './paths';

export async function confirm(
  type: SupportedCTypes,
  json: Input,
  ky: KyInstance,
) {
  const url = generatePath(paths.confirm, type);
  return ky.post(url, { json }).json();
}
