import { z } from 'zod';
import { Request, ResponseToolkit, ServerRoute } from '@hapi/hapi';

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

import { instagramEndpoints } from './instagramEndpoints';
import { instagramCType } from './instagramCType';

const zodPayload = z.object({
  sessionId: z.string(),
  code: z.string(),
  secret: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export interface Output {
  id: string;
  username: string;
  account_type: string;
}

async function handler(request: Request, h: ResponseToolkit) {
  const { logger } = request;
  logger.debug('Instagram authorization started');

  const { secret, sessionId, code } = request.payload as Input;

  // This is the initial session in the first tab the user has open
  const firstSession = getSessionBySecret(secret);
  if (!firstSession) {
    throw Boom.notFound('No session found for secret');
  }
  logger.debug('Found session with secret');
  deleteSecret(secret);

  const session = getSessionWithDid({ sessionId });

  logger.debug('Exchanging code for access token');

  const body = (await got
    .post(instagramEndpoints.token, {
      form: {
        client_id: configuration.instagram.clientId,
        client_secret: configuration.instagram.secret,
        grant_type: 'authorization_code',
        redirect_uri: instagramEndpoints.redirectUri,
        code,
      },
    })
    .json()) as { access_token: string; user_id: string };
  logger.debug(body);
  logger.debug('Access token granted, fetching instagram profile');
  const searchParams = {
    fields: 'id,username,account_type',
    access_token: body.access_token,
  };
  const url = new URL(`/${body.user_id}`, instagramEndpoints.profile);
  url.search = new URLSearchParams(searchParams).toString();
  logger.debug(url.toString());
  const profile = (await got(url).json()) as {
    id: string;
    username: string;
    account_type: string;
  };
  logger.debug(profile);
  logger.debug('Found Instagram profile, creating claim');

  const claimContents = {
    Username: profile.username,
    'User ID': profile.id,
    'Account Type': profile.account_type,
  };
  const claim = Claim.fromCTypeAndClaimContents(
    instagramCType,
    claimContents,
    session.did,
  );

  setSession({ ...session, claim, confirmed: true });

  logger.debug('Instagram claim created');

  return h.response(profile as Output);
}

export const confirmInstagram: ServerRoute = {
  method: 'POST',
  path: paths.instagram.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
