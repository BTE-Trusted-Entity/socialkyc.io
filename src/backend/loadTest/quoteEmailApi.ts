import got from 'got';

import { Input, Output } from '../email/quoteEmail';
import { paths } from '../endpoints/paths';
import { sessionHeader } from '../endpoints/sessionHeader';

import { configuration } from '../utilities/configuration';

export async function quoteEmailApi(
  json: Input,
  sessionId: string,
): Promise<Output> {
  return got
    .post(`${configuration.baseUri}${paths.email.quote}`, {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}
