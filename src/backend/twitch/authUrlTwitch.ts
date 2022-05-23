import { Request, ServerRoute } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';
import { getSecretForSession, getSession } from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { twitchEndpoints } from './twitchEndpoints';

export type Input = Record<string, never>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('Twitch auth started');

  const session = getSession(request.headers);

  const secret = getSecretForSession(session.sessionId);

  const searchParams = {
    response_type: 'code',
    client_id: configuration.twitch.clientId,
    state: secret,
    redirect_uri: twitchEndpoints.redirectUri,
    force_verify: 'true',
  };
  const url = new URL(twitchEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  logger.debug('Generated twitch auth URL');
  return url.toString() as Output;
}

export const authUrlTwitch: ServerRoute = {
  method: 'POST',
  path: paths.twitch.authUrl,
  handler,
};
