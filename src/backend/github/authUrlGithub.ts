import { Request, ServerRoute } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';
import { getSecretForSession, getSession } from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { githubEndpoints } from './githubEndpoints';

export type Input = Record<string, never>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('github auth started');

  const session = getSession(request.headers);

  const secret = getSecretForSession(session.sessionId);

  const searchParams = {
    client_id: configuration.github.clientId,
    scope: 'user',
    state: secret,
    redirect_uri: githubEndpoints.redirectUri,
  };
  const url = new URL(githubEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  logger.debug('Generated github auth URL');
  return url.toString() as Output;
}

export const authUrlgithub: ServerRoute = {
  method: 'POST', // why is that a POST if it has no parameters / body and is used to get a URL ?
  path: paths.github.authUrl,
  handler,
};
