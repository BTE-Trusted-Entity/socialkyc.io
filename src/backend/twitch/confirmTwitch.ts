import type { BaseLogger } from 'pino';

import got from 'got';
import { Claim, DidUri, IClaim } from '@kiltprotocol/sdk-js';

import { configuration } from '../utilities/configuration';

import { twitchEndpoints } from './twitchEndpoints';
import { twitchCType } from './twitchCType';

export interface Output {
  Username: string;
  'User ID': string;
}

export async function confirmTwitch(
  code: string,
  did: DidUri,
  logger: BaseLogger,
) {
  logger.debug('Exchanging code for access token');

  const body = (await got
    .post(twitchEndpoints.token, {
      form: {
        code,
        grant_type: 'authorization_code',
        client_id: configuration.twitch.clientId,
        client_secret: configuration.twitch.secret,
        redirect_uri: twitchEndpoints.redirectUri,
      },
    })
    .json()) as { access_token: string };

  logger.debug('Access token granted, fetching twitch profile');

  const headers = {
    Authorization: `Bearer ${body.access_token}`,
    'Client-Id': configuration.twitch.clientId,
  };
  const profile = (await got(twitchEndpoints.profile, {
    headers,
  }).json()) as { data: [{ login: string; id: string }] };

  logger.debug('Found Twitch profile, creating claim');

  const { login, id } = profile.data[0];

  const claimContents = {
    Username: login,
    'User ID': id,
  };
  const claim = Claim.fromCTypeAndClaimContents(
    twitchCType,
    claimContents,
    did,
  ) as IClaim & { contents: Output };

  logger.debug('Twitch claim created');

  await got.post(twitchEndpoints.revoke, {
    form: {
      token: body.access_token,
      client_id: configuration.twitch.clientId,
    },
  });

  logger.debug('Access token revoked');

  return claim;
}
