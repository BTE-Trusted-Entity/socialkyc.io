import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';
import got from 'got';

import {
  deleteSecret,
  getSession,
  getSessionBySecret,
  setSession,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';

import { emailCType } from './emailCType';
import { configuration } from '../utilities/configuration';
import { discordEndpoints } from './discordEndpoints';

const zodPayload = z.object({
  secret: z.string(),
  sessionId: z.string(),
  code: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = undefined;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Email confirmation started');

  // https://nicememe.website/?code=NhhvTDYsFcdgNLnnLijcl7Ku7bEEeee&state=15773059ghq9183habn
  const { secret, sessionId, code } = request.payload as Input;

  // This is the initial session in the first tab the user has open
  const firstSession = getSessionBySecret(secret);
  const { requestForAttestation } = firstSession;
  if (!requestForAttestation) {
    throw Boom.notFound('requestForAttestation not found');
  }
  if (requestForAttestation.claim.cTypeHash !== emailCType.hash) {
    throw Boom.notFound('requestForAttestation cType mismatch');
  }

  // Clicking the confirmation link in the email opens a new tab with a new session
  const currentSession = getSession({ sessionId });

  // carry over the request to the current session and clean up the initial one
  setSession({ ...currentSession, requestForAttestation, confirmed: true });
  delete firstSession.requestForAttestation;
  setSession(firstSession);
  deleteSecret(secret);

  const body = await got
    .post(discordEndpoints.token, {
      form: {
        code,
        grant_type: 'authorization_code',
        client_id: configuration.discord.clientId,
        client_secret: configuration.discord.clientSecret,
        redirect_uri: discordEndpoints.redirectUri,
      },
    })
    .json();

  const headers = {
    Authorization: `Bearer ${body.access_token}`,
  };
  const profile = await got(discordEndpoints.profile, {
    headers,
  }).json();
  console.log(profile.id, profile.username, profile.discriminator);

  await got.post(discordEndpoints.revoke, {
    form: {
      token: body.access_token,
      client_id: configuration.discord.clientId,
      client_secret: configuration.discord.clientSecret,
    },
  });

  logger.debug('Email confirmation completed');

  return h.response(<Output>undefined);
}

export const confirmDiscord: ServerRoute = {
  method: 'POST',
  path: paths.email.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
