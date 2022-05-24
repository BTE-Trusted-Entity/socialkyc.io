import { StatusCodes } from 'http-status-codes';
import { HTTPError } from 'ky';

export function isHttpStatusCode(error: unknown, code: StatusCodes) {
  return error instanceof HTTPError && error.response.status === code;
}
