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

import { githubEndpoints } from './githubEndpoints';
import { githubCType } from './githubCType';

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
  logger.debug('Github authorization started');

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

    const formatHeader = {
      Accept: 'application/json',
    };
    const body = (await got
      .post(githubEndpoints.token, {
        headers: formatHeader,
        form: {
          code,
          client_id: configuration.github.clientId,
          client_secret: configuration.github.secret,
          redirect_uri: githubEndpoints.redirectUri,
        },
      })
      .json()) as { access_token: string };

    logger.debug('Access token granted, fetching github profile');

    const { access_token } = body;

    const accessHeader = {
      Authorization: `token ${access_token}`,
    };
    const profile = (await got(githubEndpoints.profile, {
      headers: accessHeader,
    }).json()) as { login: string; id: string };

    logger.debug('Found Github profile, creating claim');

    const { login, id } = profile;

    const claimContents = {
      Username: login,
      'User ID': id.toString(),
    };
    const claim = Claim.fromCTypeAndClaimContents(
      githubCType,
      claimContents,
      session.did,
    );

    setSession({ ...session, claim, confirmed: true });

    logger.debug('Github claim created');

    return h.response(profile as Output);
  } catch (exception) {
    const error = exceptionToError(exception);
    logger.error(error);
    throw Boom.boomify(error);
  }
}

export const confirmGithub: ServerRoute = {
  method: 'POST',
  path: paths.github.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
