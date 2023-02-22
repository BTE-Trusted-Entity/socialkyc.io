import type { Request, ServerRoute } from '@hapi/hapi';

import { z } from 'zod';

import { getSecretForSession, getSession } from '../utilities/sessionStorage';
import { authUrlDiscord as discord } from '../discord/authUrlDiscord';
import { authUrlGithub as github } from '../github/authUrlGithub';
import { authUrlTelegram as telegram } from '../telegram/authUrlTelegram';
import { authUrlTwitch as twitch } from '../twitch/authUrlTwitch';
import { authUrlYoutube as youtube } from '../youtube/authUrlYoutube';

import { paths } from './paths';

const types = ['discord', 'github', 'telegram', 'twitch', 'youtube'] as const;
type AuthUrlType = (typeof types)[number];

const generatorsForType: Record<
  AuthUrlType,
  (secret: string) => Promise<string>
> = {
  discord,
  github,
  telegram,
  twitch,
  youtube,
};

export type Input = Record<string, never>;

export type Output = string;

async function handler(
  request: Request<{ Params: { type: AuthUrlType } }>,
): Promise<string> {
  const {
    logger,
    params: { type },
  } = request;
  logger.debug(`Auth started for ${type}`);

  const session = getSession(request.headers);
  const secret = getSecretForSession(session.sessionId);

  const generator = generatorsForType[type];
  const url = await generator(secret);

  logger.debug(`Generated auth URL for ${type}`);
  return url as Output;
}

const zodParams = z.object({ type: z.enum(types) });

export const authUrl = {
  method: 'POST',
  path: paths.authUrl,
  handler,
  options: { validate: { params: async (params) => zodParams.parse(params) } },
} as ServerRoute;
