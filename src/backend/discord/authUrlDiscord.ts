import { Request, ServerRoute } from '@hapi/hapi';

import { configuration } from '../utilities/configuration';
import { getSecretForSession, getSession } from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { discordEndpoints } from './discordEndpoints';

export type Input = Record<string, never>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('Discord auth started');

  const session = getSession(request.headers);

  const secret = getSecretForSession(session.sessionId);

  const searchParams = {
    response_type: 'code',
    client_id: configuration.discord.clientId,
    prompt: 'consent',
    scope: 'identify',
    state: secret,
    redirect_uri: discordEndpoints.redirectUri,
  };
  const url = new URL(discordEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  logger.debug('Generated discord auth URL');
  return url.toString() as Output;
}

export const authUrlDiscord: ServerRoute = {
  method: 'POST',
  path: paths.discord.authUrl,
  handler,
};
