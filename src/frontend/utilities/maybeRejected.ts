import { ResponsePromise } from 'ky';
import { StatusCodes } from 'http-status-codes';

import { ExplicitRejection } from './session';
import { isHttpStatusCode } from './isHttpStatusCode';

export async function maybeRejected(
  responsePromise: ResponsePromise,
): Promise<string> {
  try {
    return await responsePromise.text();
  } catch (exception) {
    if (isHttpStatusCode(exception, StatusCodes.CONFLICT)) {
      throw new ExplicitRejection('Terms rejected');
    }
    throw exception;
  }
}
