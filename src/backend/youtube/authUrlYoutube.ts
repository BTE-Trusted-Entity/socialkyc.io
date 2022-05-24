import { Request, ServerRoute } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';
import { getSecretForSession, getSession } from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { youtubeEndpoints } from './youtubeEndpoints';

export type Input = Record<string, never>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('Youtube auth started');

  const session = getSession(request.headers);
  const secret = getSecretForSession(session.sessionId);

  const searchParams = {
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    include_granted_scopes: 'true',
    state: secret,
    redirect_uri: youtubeEndpoints.redirectUri,
    response_type: 'code',
    client_id: configuration.youtube.clientId,
  };
  const url = new URL(youtubeEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  logger.debug('Generated youtube auth URL');
  return url.toString() as Output;
}

export const authUrlYoutube: ServerRoute = {
  method: 'POST',
  path: paths.youtube.authUrl,
  handler,
};
