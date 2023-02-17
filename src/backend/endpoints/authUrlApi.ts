import type { KyInstance } from 'ky/distribution/types/ky';

import type { SupportedCTypes } from '../utilities/supportedCTypes';

import { generatePath, paths } from './paths';
import { Input, Output } from './authUrl';

export async function authUrl(
  type: SupportedCTypes,
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  const url = generatePath(paths.authUrl, type);
  return ky.post(url, { json }).text();
}
