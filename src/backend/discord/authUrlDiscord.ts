import { Request, ServerRoute } from '@hapi/hapi';

import { z } from 'zod';

import Boom from '@hapi/boom';

import { configuration } from '../utilities/configuration';
import {
  getSecretForSession,
  getSession,
  PayloadWithSession,
} from '../utilities/sessionStorage';

import { paths } from '../endpoints/paths';

import { exceptionToError } from '../../frontend/utilities/exceptionToError';

import { discordEndpoints } from './discordEndpoints';

const zodPayload = z.object({
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('Discord auth started');
  try {
    const session = getSession(request.payload as PayloadWithSession);

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
  } catch (exception) {
    const error = exceptionToError(exception);
    logger.error(error);
    throw Boom.boomify(error);
  }
}

export const authUrlDiscord: ServerRoute = {
  method: 'POST',
  path: paths.discord.auth,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
