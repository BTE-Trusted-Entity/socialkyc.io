import { z } from 'zod';
import {
  Request,
  ResponseToolkit,
  ResponseObject,
  ServerRoute,
} from '@hapi/hapi';

import got from 'got';

import Boom from '@hapi/boom';

import { paths } from '../endpoints/paths';

import { configuration } from '../utilities/configuration';

import { steamEndpoints } from './steamEndpoints';

const zodPayload = z.object({
  'openid.assoc_handle': z.string(),
  'openid.claimed_id': z.string(),
  'openid.identity': z.string(),
  'openid.mode': z.string(),
  'openid.ns': z.string(),
  'openid.op_endpoint': z.string(),
  'openid.response_nonce': z.string(),
  'openid.return_to': z.string(),
  'openid.sig': z.string(),
  'openid.signed': z.string(),
});

export type Input = z.infer<typeof zodPayload>;
export type Output = Record<string, string>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Steam authorization started');

  const payload = request.payload as Input;

  // TODO: Verify Return URL
  // https://openid.net/specs/openid-authentication-2_0.html#verify_return_to

  // TODO: Verify Discovered Information
  // https://openid.net/specs/openid-authentication-2_0.html#verify_disco

  // TODO: Check the nonce
  // https://openid.net/specs/openid-authentication-2_0.html#verify_nonce

  // Verify signature
  payload['openid.mode'] = 'check_authentication';

  const data = await got
    .post(steamEndpoints.login, {
      form: payload,
    })
    .text();

  const splitData = data.split('\n');
  if (!splitData.includes('is_valid:true')) {
    throw Boom.unauthorized('Unable to verify assertion');
  }
  logger.debug('Assertion verified, fetching Steam profile');

  const id = payload['openid.identity'].split('/').pop();

  const profile = (await got(steamEndpoints.profile, {
    searchParams: {
      key: configuration.steamApiKey,
      steamids: id,
    },
  }).json()) as unknown as { response: { players: [Record<string, string>] } };

  console.log('profile: ', profile.response.players[0]);

  return h.response(profile.response.players[0] as Output);
}

export const confirmSteam: ServerRoute = {
  method: 'POST',
  path: paths.steam.confirm,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
