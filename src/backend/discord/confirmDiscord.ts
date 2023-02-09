import { z } from 'zod';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import got from 'got';

import * as Boom from '@hapi/boom';

import { Claim } from '@kiltprotocol/core';

import {
  deleteSecret,
  getSessionBySecret,
  getSession,
  setSession,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';
import { configuration } from '../utilities/configuration';

import { discordEndpoints } from './discordEndpoints';
import { discordCType } from './discordCType';

const zodPayload = z.object({
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

  const { secret, code } = request.payload as Input;

  // This is the initial session in the first tab the user has open
  const firstSession = getSessionBySecret(secret);
  if (!firstSession) {
    throw Boom.notFound('No session found for secret');
  }
  logger.debug('Found session with secret');
  deleteSecret(secret);

  const session = getSession(request.headers);

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

  logger.debug('Found Discord profile, creating claim');

  const { username, discriminator, id } = profile;

  const claimContents = {
    Username: username,
    Discriminator: discriminator,
    'User ID': id,
  };
  const claim = Claim.fromCTypeAndClaimContents(
    discordCType,
    claimContents,
    session.did,
  );

  setSession({ ...session, claim, confirmed: true });

  logger.debug('Discord claim created');

  await got.post(discordEndpoints.revoke, {
    form: {
      token: body.access_token,
      client_id: configuration.discord.clientId,
      client_secret: configuration.discord.clientSecret,
    },
  });

  logger.debug('Access token revoked');

  return h.response(profile as Output);
}

export const confirmDiscord: ServerRoute = {
  method: 'POST',
  path: paths.discord.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
