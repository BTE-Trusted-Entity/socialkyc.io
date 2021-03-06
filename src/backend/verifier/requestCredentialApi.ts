import ky from 'ky';

import { paths } from '../endpoints/paths';
import { sessionHeader } from '../endpoints/sessionHeader';

import { Input, Output } from './requestCredential';

export async function requestCredential(
  json: Input,
  sessionId: string,
): Promise<Output> {
  const headers = { [sessionHeader]: sessionId };
  return ky.post(paths.verifier.requestCredential, { json, headers }).json();
}
