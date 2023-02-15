import { StatusCodes } from 'http-status-codes';
import { z } from 'zod';
import {
  Request,
  ResponseToolkit,
  ResponseObject,
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

import { youtubeEndpoints } from './youtubeEndpoints';
import { youtubeCType } from './youtubeCType';

const zodPayload = z.object({
  code: z.string(),
  secret: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export interface Output {
  name: string;
  id: string;
}

async function revokeAccessToken(token: string): Promise<void> {
  await got.post(youtubeEndpoints.revoke, { form: { token } });
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Youtube authorization started');

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
    .post(youtubeEndpoints.token, {
      form: {
        code: decodeURIComponent(code),
        grant_type: 'authorization_code',
        client_id: configuration.youtube.clientId,
        client_secret: configuration.youtube.clientSecret,
        redirect_uri: youtubeEndpoints.redirectUri,
      },
    })
    .json()) as { access_token: string };
  logger.debug('Access token granted, fetching youtube channel');

  const headers = {
    authorization: `Bearer ${body.access_token}`,
  };

  const searchParams = {
    part: 'id,snippet',
    mine: 'true',
  };

  const { items } = (await got(youtubeEndpoints.channel, {
    headers,
    searchParams,
  }).json()) as { items?: Array<{ id: string; snippet: { title: string } }> };

  if (!items || items.length === 0) {
    logger.info('No Youtube channel found');

    await revokeAccessToken(body.access_token);
    logger.debug('Access token revoked');

    return h.response().code(StatusCodes.NO_CONTENT);
  }

  if (items.length > 1) {
    // User should be able to authorize only one specific channel on the OAuth screen
    logger.warn(
      'Multiple channels found, but this should never happen. As a fallback we use the first list item.',
    );
  }

  const channel: Output = {
    name: items[0].snippet.title,
    id: items[0].id,
  };

  logger.debug('Found Youtube channel, creating claim');

  const claimContents = {
    'Channel Name': channel.name,
    'Channel ID': channel.id,
  };
  const claim = Claim.fromCTypeAndClaimContents(
    youtubeCType,
    claimContents,
    session.did,
  );

  setSession({ ...session, claim, confirmed: true });
  logger.debug('Youtube claim created');

  await revokeAccessToken(body.access_token);
  logger.debug('Access token revoked');

  return h.response(channel as Output);
}

export const confirmYoutube: ServerRoute = {
  method: 'POST',
  path: paths.youtube.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
