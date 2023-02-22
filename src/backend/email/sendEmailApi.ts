import { KyInstance } from 'ky/distribution/types/ky';
import { StatusCodes } from 'http-status-codes';

import { paths } from '../endpoints/paths';
import { isHttpStatusCode } from '../../frontend/utilities/isHttpStatusCode';

import { Input, Output } from './sendEmail';

export class InvalidEmail extends Error {}

export async function sendEmail(json: Input, ky: KyInstance): Promise<Output> {
  try {
    return await ky.post(paths.email.send, { json }).json();
  } catch (exception) {
    if (isHttpStatusCode(exception, StatusCodes.BAD_REQUEST)) {
      throw new InvalidEmail('Invalid email syntax');
    }
    throw exception;
  }
}
