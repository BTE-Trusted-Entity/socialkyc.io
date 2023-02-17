import type { KyInstance } from 'ky/distribution/types/ky';

import type { SupportedCTypes } from '../utilities/supportedCTypes';

import { generatePath, paths } from './paths';
import { Input, Output } from './quote';

export async function quote(
  type: SupportedCTypes,
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  const url = generatePath(paths.quote, type);
  return ky.post(url, { json }).json();
}
