import { Request, ServerRoute } from '@hapi/hapi';
import { z } from 'zod';

import { configuration } from '../utilities/configuration';
import {
  getSecretForSession,
  getSession,
  PayloadWithSession,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { instagramEndpoints } from './instagramEndpoints';

const zodPayload = z.object({
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('Instagram auth started');

  const session = getSession(request.payload as PayloadWithSession);

  const secret = getSecretForSession(session.sessionId);

  const searchParams = {
    client_id: configuration.instagram.clientId,
    redirect_uri: instagramEndpoints.redirectUri,
    scope: 'user_profile,user_media',
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
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
