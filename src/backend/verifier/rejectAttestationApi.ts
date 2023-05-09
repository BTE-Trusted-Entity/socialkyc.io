import ky from 'ky';

import { paths } from '../endpoints/paths';
import { sessionHeader } from '../endpoints/sessionHeader';

import { Input, Output } from './rejectAttestation';

export async function rejectAttestation(
  json: Input,
  sessionId: string,
): Promise<Output> {
  const headers = { [sessionHeader]: sessionId };
  return ky.post(paths.verifier.rejectAttestation, { json, headers }).json();
}
