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

import { linkedInEndpoints } from './linkedInEndpoints';
import { linkedInCType } from './linkedInCType';

const zodPayload = z.object({
  sessionId: z.string(),
  code: z.string(),
  secret: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export interface Output {
  id: string;
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('LinkedIn authorization started');

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
    .post(linkedInEndpoints.token, {
      form: {
        code,
        grant_type: 'authorization_code',
        client_id: configuration.linkedIn.clientId,
        client_secret: configuration.linkedIn.secret,
        redirect_uri: linkedInEndpoints.redirectUri,
      },
    })
    .json()) as { access_token: string };

  logger.debug('Access token granted, fetching linkedIn profile');

  const headers = {
    Authorization: `Bearer ${body.access_token}`,
  };
  const profile = (await got(linkedInEndpoints.profile, {
    headers,
  }).json()) as {
    localizedFirstName: string;
    localizedLastName: string;
    id: string;
  };

  logger.debug('Found LinkedIn profile, creating claim');

  const { id, localizedFirstName, localizedLastName } = profile;

  const claimContents = {
    'First name': localizedFirstName,
    'Last name': localizedLastName,
    'User ID': id,
  };
  const claim = Claim.fromCTypeAndClaimContents(
    linkedInCType,
    claimContents,
    session.did,
  );

  setSession({ ...session, claim, confirmed: true });

  logger.debug('LinkedIn claim created');

  await got.post(linkedInEndpoints.revoke, {
    form: {
      token: body.access_token,
      client_id: configuration.linkedIn.clientId,
      client_secret: configuration.linkedIn.secret,
    },
  });

  logger.debug('Access token revoked');

  return h.response(profile as Output);
}

export const confirmLinkedIn: ServerRoute = {
  method: 'POST',
  path: paths.linkedIn.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
