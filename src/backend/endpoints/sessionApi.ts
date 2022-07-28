import ky from 'ky';

import {
  CheckSessionInput,
  CheckSessionOutput,
  GetSessionOutput,
} from './session';
import { paths } from './paths';
import { sessionHeader } from './sessionHeader';

/** GET request to /api/session which creates a new (unconfirmed) session in the backend */
export async function getSessionValues(): Promise<GetSessionOutput> {
  return ky.get(paths.session).json();
}

/** POST request to /api/session, setting backend session to 'confirmed' and populating did info if encrypted challenge checks out */
export async function checkSession(
  json: CheckSessionInput,
  sessionId: string,
): Promise<CheckSessionOutput> {
  const headers = { [sessionHeader]: sessionId };
  await ky.post(paths.session, { json, headers });
}
