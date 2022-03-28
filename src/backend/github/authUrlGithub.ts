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

import { githubEndpoints } from './githubEndpoints';

const zodPayload = z.object({
  sessionId: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = string;

async function handler(request: Request): Promise<string> {
  const { logger } = request;
  logger.debug('github auth started');
  try {
    const session = getSession(request.payload as PayloadWithSession);

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
  } catch (exception) {
    throw Boom.boomify(exceptionToError(exception));
  }
}

export const authUrlgithub: ServerRoute = {
  method: 'POST',
  path: paths.github.authUrl,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
