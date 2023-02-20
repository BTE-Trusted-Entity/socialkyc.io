import type { DidUri, IClaim } from '@kiltprotocol/types';
import type {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import type { BaseLogger } from 'pino';

import { z } from 'zod';
import * as Boom from '@hapi/boom';

import {
  deleteSecret,
  getSession,
  getSessionBySecret,
  setSession,
} from '../utilities/sessionStorage';
import { confirmGithub as github } from '../github/confirmGithub';
import { confirmDiscord as discord } from '../discord/confirmDiscord';
import { confirmTwitch as twitch } from '../twitch/confirmTwitch';
import { confirmYoutube as youtube } from '../youtube/confirmYoutube';

import { paths } from './paths';

type ConfirmType = 'discord' | 'github' | 'twitch' | 'youtube';

const confirmationsForType: Record<
  ConfirmType,
  (code: string, did: DidUri, logger: BaseLogger) => Promise<IClaim>
> = {
  github,
  discord,
  twitch,
  youtube,
};

const zodPayload = z.object({
  code: z.string(),
  secret: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

async function handler(
  request: Request<{ Params: { type: ConfirmType }; Payload: Input }>,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const {
    logger,
    params: { type },
  } = request;
  logger.debug(`Authorization started for ${type}`);

  const { secret, code } = request.payload;

  // This is the initial session in the first tab the user has open
  const firstSession = getSessionBySecret(secret);
  if (!firstSession) {
    throw Boom.notFound('No session found for secret');
  }
  logger.debug('Found session with secret');
  deleteSecret(secret);

  const session = getSession(request.headers);

  const confirmation = confirmationsForType[type];
  const claim = await confirmation(code, session.did, logger);

  setSession({ ...session, claim, confirmed: true });

  logger.debug(`Claim created for ${type}`);

  return h.response(claim.contents);
}

export const confirm = {
  method: 'POST',
  path: paths.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
} as ServerRoute;
