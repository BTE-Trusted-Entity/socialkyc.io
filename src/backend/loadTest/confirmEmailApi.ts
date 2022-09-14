import got from 'got';

import { Input, Output } from '../email/confirmEmail';
import { paths } from '../endpoints/paths';

import { sessionHeader } from '../endpoints/sessionHeader';
import { configuration } from '../utilities/configuration';

export async function confirmEmailApi(
  json: Input,
  sessionId: string,
): Promise<Output> {
  return got
    .post(`${configuration.baseUri}${paths.email.confirm}`, {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}
