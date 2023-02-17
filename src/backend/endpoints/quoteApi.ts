import type { KyInstance } from 'ky/distribution/types/ky';

import type { SupportedCTypes } from '../utilities/supportedCTypes';

import { paths } from './paths';
import { Input, Output } from './quote';

export async function quote(
  type: SupportedCTypes,
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  return ky.post(`${paths.quote}/${type}`, { json }).json();
}
