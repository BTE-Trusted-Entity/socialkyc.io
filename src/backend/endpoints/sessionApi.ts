import ky from 'ky';

import {
  CheckSessionInput,
  CheckSessionOutput,
  GetSessionOutput,
} from './session';
import { paths } from './paths';
import { sessionHeader } from './sessionHeader';

export async function getSessionValues(): Promise<GetSessionOutput> {
  return ky.get(paths.session).json();
}

export async function checkSession(
  json: CheckSessionInput,
  sessionId: string,
): Promise<CheckSessionOutput> {
  const headers = { [sessionHeader]: sessionId };
  await ky.post(paths.session, { json, headers });
}
