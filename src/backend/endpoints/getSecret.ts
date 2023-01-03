import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { getSecretForSession, getSession } from '../utilities/sessionStorage';

import { paths } from './paths';

export type Output = { secret: string };

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Fetching secret for session ID');
  const { sessionId } = getSession(request.headers);

  const secret = getSecretForSession(sessionId);

  return h.response({ secret } as Output);
}

export const getSecret: ServerRoute = {
  method: 'POST',
  path: paths.test.secret,
  handler,
};
