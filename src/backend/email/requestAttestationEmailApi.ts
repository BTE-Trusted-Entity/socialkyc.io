import { KyInstance } from 'ky/distribution/types/ky';
import { StatusCodes } from 'http-status-codes';

import { paths } from '../endpoints/paths';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';
import { isHttpStatusCode } from '../../frontend/utilities/isHttpStatusCode';

import { Input, Output } from './requestAttestationEmail';

export class InvalidEmail extends Error {}

export async function requestAttestationEmail(
  json: Input,
  ky: KyInstance,
): Promise<Output> {
  try {
    await maybeRejected(ky.post(paths.email.requestAttestation, { json }));
  } catch (exception) {
    if (isHttpStatusCode(exception, StatusCodes.BAD_REQUEST)) {
      throw new InvalidEmail('Invalid email syntax');
    }
    throw exception;
  }
}
