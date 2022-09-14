import got from 'got';

import { paths } from '../endpoints/paths';
import { sessionHeader } from '../endpoints/sessionHeader';

import { Input, Output } from '../email/attestationEmail';
import { configuration } from '../utilities/configuration';

const gotInstance = got.extend({
  timeout: {},
  retry: {
    limit: 10,
    methods: ['post'],
  },
});

export async function attestEmailApi(
  json: Input,
  sessionId: string,
): Promise<Output> {
  return gotInstance
    .post(`${configuration.baseUri}${paths.email.attest}`, {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}
