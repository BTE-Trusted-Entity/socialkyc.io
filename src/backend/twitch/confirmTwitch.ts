import { z } from 'zod';
import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ServerRoute,
} from '@hapi/hapi';

import got from 'got';

import Boom from '@hapi/boom';

import { Claim } from '@kiltprotocol/core';

import {
  deleteSecret,
  getSessionBySecret,
  getSessionWithDid,
  setSession,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';
import { configuration } from '../utilities/configuration';

import { exceptionToError } from '../../frontend/utilities/exceptionToError';

import { twitchEndpoints } from './twitchEndpoints';
import { twitchCType } from './twitchCType';

const zodPayload = z.object({
  sessionId: z.string(),
  code: z.string(),
  secret: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export interface Output {
  login: string;
  id: string;
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitch authorization started');

  const { secret, sessionId, code } = request.payload as Input;

  // This is the initial session in the first tab the user has open
  const firstSession = getSessionBySecret(secret);
  if (!firstSession) {
    throw Boom.notFound('No session found for secret');
  }
  logger.debug('Found session with secret');
  deleteSecret(secret);

  const session = getSessionWithDid({ sessionId });

  try {
    logger.debug('Exchanging code for access token');

    const body = (await got
      .post(twitchEndpoints.token, {
        form: {
          code,
          grant_type: 'authorization_code',
          client_id: configuration.twitch.clientId,
          client_secret: configuration.twitch.secret,
          redirect_uri: twitchEndpoints.redirectUri,
        },
      })
      .json()) as { access_token: string };

    logger.debug('Access token granted, fetching twitch profile');

    const headers = {
      Authorization: `Bearer ${body.access_token}`,
      'Client-Id': configuration.twitch.clientId,
    };
    const profile = (await got(twitchEndpoints.profile, {
      headers,
    }).json()) as { data: [{ login: string; id: string }] };

    logger.debug('Found Twitch profile, creating claim');

    const { login, id } = profile.data[0];

    const claimContents = {
      Username: login,
      'User ID': id,
    };
    const claim = Claim.fromCTypeAndClaimContents(
      twitchCType,
      claimContents,
      session.did,
    );

    setSession({ ...session, claim, confirmed: true });

    logger.debug('Twitch claim created');

    await got.post(twitchEndpoints.revoke, {
      form: {
        token: body.access_token,
        client_id: configuration.twitch.clientId,
      },
    });

    logger.debug('Access token revoked');

    return h.response(profile.data[0] as Output);
  } catch (exception) {
    const error = exceptionToError(exception);
    logger.error(error);
    throw Boom.boomify(error);
  }
}

export const confirmTwitch: ServerRoute = {
  method: 'POST',
  path: paths.twitch.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
