import ky from 'ky';
import { StatusCodes } from 'http-status-codes';

import { paths } from '../endpoints/paths';

import { Input, Output } from './confirmYoutube';

export async function confirmYoutube(input: Input): Promise<Output> {
  const result = await ky.post(paths.youtube.confirm, { json: input });

  if (result.status === StatusCodes.NO_CONTENT) {
    throw new Error('No channels found');
  }

  return result.json();
}
