import { Request, ServerRoute } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';
import { getSecretForSession, getSession } from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { instagramEndpoints } from './instagramEndpoints';

export type Input = Record<string, never>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('Instagram auth started');

  const session = getSession(request.headers);

  const secret = getSecretForSession(session.sessionId);

  const searchParams = {
    client_id: configuration.instagram.clientId,
    redirect_uri: instagramEndpoints.redirectUri,
    scope: 'user_profile',
    response_type: 'code',
    state: secret,
  };
  const url = new URL(instagramEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  logger.debug('Generated instagram auth URL');
  return url.toString() as Output;
}

export const authUrlInstagram: ServerRoute = {
  method: 'POST',
  path: paths.instagram.authUrl,
  handler,
};
