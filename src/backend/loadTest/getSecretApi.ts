import got from 'got';

import { paths } from '../endpoints/paths';
import { sessionHeader } from '../endpoints/sessionHeader';

import { configuration } from '../utilities/configuration';

import { Input, Output } from './getSecret';

export async function getSecretApi(
  json: Input,
  sessionId: string,
): Promise<Output> {
  return got
    .post(`${configuration.baseUri}${paths.test.secret}`, {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}
