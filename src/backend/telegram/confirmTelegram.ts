import { createHash, createHmac } from 'node:crypto';

import type {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { z } from 'zod';
import * as Boom from '@hapi/boom';

import { CType } from '@kiltprotocol/credentials';

import {
  ContentfulClaim,
  getSession,
  setSession,
} from '../utilities/sessionStorage';
import { paths } from '../endpoints/paths';
import { configuration } from '../utilities/configuration';

import { telegramCType } from './telegramCType';

const zodPayload = z.object({
  json: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export interface Profile {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface Output {
  'User ID': number;
  'First name': string;
  'Last name'?: string;
  Username?: string;
}

function validateAuthData(json: string): void {
  const { hash, ...rest } = JSON.parse(json).auth_data as {
    hash: string;
    auth_date: number;
  };

  const dayAgoTimestamp = Date.now() / 1000 - 24 * 60 * 60;
  if (rest.auth_date < dayAgoTimestamp) {
    throw Boom.forbidden('Auth data is too old');
  }

  const plaintext = Object.entries(rest)
    .map(([key, value]) => `${key}=${value}`)
    .sort()
    .join('\n');

  const secret = createHash('sha256')
    .update(configuration.telegram.token)
    .digest();

  const computed = createHmac('sha256', secret)
    .update(plaintext)
    .digest()
    .toString('hex');

  if (hash !== computed) {
    throw Boom.forbidden('Auth data hash doesn’t match');
  }
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Telegram authorization started');

  const { json } = request.payload as Input;
  const session = getSession(request.headers);

  logger.debug('Parsing Telegram profile');

  const profile = JSON.parse(json).auth_data as Profile;

  logger.debug('Parsed Telegram profile, creating claim');

  const claimContents = {
    'First name': profile.first_name,
    'User ID': profile.id,
    ...(profile.last_name && { 'Last name': profile.last_name }),
    ...(profile.username && { Username: profile.username }),
  };
  const claim: ContentfulClaim & { contents: Output } = {
    cTypeHash: CType.idToHash(telegramCType.$id),
    contents: claimContents,
  };

  setSession({ ...session, claim, confirmed: true });

  logger.debug('Telegram claim created');

  return h.response(claim.contents as Output);
}

export const confirmTelegram: ServerRoute = {
  method: 'POST',
  path: paths.telegram.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => {
        const { json } = zodPayload.parse(payload);
        validateAuthData(json);
      },
    },
  },
};
