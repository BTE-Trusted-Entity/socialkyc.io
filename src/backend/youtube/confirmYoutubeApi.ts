import { KyInstance } from 'ky/distribution/types/ky';
import { StatusCodes } from 'http-status-codes';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmYoutube';

export async function confirmYoutube(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  const result = await ky.post(paths.youtube.confirm, { json });

  if (result.status === StatusCodes.NO_CONTENT) {
    throw new Error('No channels found');
  }

  return result.json();
}
