import { Request, ServerRoute } from '@hapi/hapi';
import { z } from 'zod';

import { configuration } from '../utilities/configuration';
import {
  getSecretForSession,
  getSession,
  PayloadWithSession,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { twitchEndpoints } from './twitchEndpoints';

const zodPayload = z.object({
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('Twitch auth started');

  const session = getSession(request.payload as PayloadWithSession);

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
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
