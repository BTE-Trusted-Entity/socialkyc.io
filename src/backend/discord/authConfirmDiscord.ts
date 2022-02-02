import { z } from 'zod';
import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ServerRoute,
} from '@hapi/hapi';

import got from 'got';

import Boom from '@hapi/boom';

import {
  deleteSecret,
  getSession,
  getSessionBySecret,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';
import { configuration } from '../utilities/configuration';

import { exceptionToError } from '../../frontend/utilities/exceptionToError';

import { discordEndpoints } from './discordEndpoints';

const zodPayload = z.object({
  sessionId: z.string(),
  code: z.string(),
  secret: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export interface Output {
  username: string;
  discriminator: string;
  id: string;
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Discord authorization started');

  // https://nicememe.website/?code=NhhvTDYsFcdgNLnnLijcl7Ku7bEEeee&state=15773059ghq9183habn
  const { secret, sessionId, code } = request.payload as Input;

  // This is the initial session in the first tab the user has open
  const firstSession = getSessionBySecret(secret);
  if (!firstSession) {
    throw Boom.notFound('No session found for secret');
  }
  logger.debug('Found session with secret');
  deleteSecret(secret);

  getSession({ sessionId });

  try {
    logger.debug('Exchanging code for access token');

    const body = (await got
      .post(discordEndpoints.token, {
        form: {
          code,
          grant_type: 'authorization_code',
          client_id: configuration.discord.clientId,
          client_secret: configuration.discord.clientSecret,
          redirect_uri: discordEndpoints.redirectUri,
          scope: 'identify',
        },
      })
      .json()) as { access_token: string };

    logger.debug('Access token granted, fetching discord profile');

    const headers = {
      authorization: `Bearer ${body.access_token}`,
    };
    const profile = (await got(discordEndpoints.profile, {
      headers,
    }).json()) as { username: string; discriminator: string; id: string };

    logger.debug('Found Discord profile');

    await got.post(discordEndpoints.revoke, {
      form: {
        token: body.access_token,
        client_id: configuration.discord.clientId,
        client_secret: configuration.discord.clientSecret,
      },
    });

    logger.debug('Access token revoked');

    return h.response(profile as Output);
  } catch (exception) {
    const error = exceptionToError(exception);
    logger.error(error);
    return Boom.boomify(error);
  }
}

export const authConfirmDiscord: ServerRoute = {
  method: 'POST',
  path: paths.discord.authConfirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
