import got from 'got';

import { sessionHeader } from '../endpoints/sessionHeader';
import { Input } from '../email/requestAttestationEmail';

import { paths } from '../endpoints/paths';

import { configuration } from '../utilities/configuration';

import { Output } from './requestAttestationEmail';

export async function requestAttestationApi(
  json: Input,
  sessionId: string,
): Promise<Output> {
  return got
    .post(`${configuration.baseUri}${paths.test.requestAttestation}`, {
      json,
      headers: { [sessionHeader]: sessionId },
    })
    .json();
}
