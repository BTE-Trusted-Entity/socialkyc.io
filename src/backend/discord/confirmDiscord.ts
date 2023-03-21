import type { BaseLogger } from 'pino';

import got from 'got';
import { Claim, DidUri, IClaim } from '@kiltprotocol/sdk-js';

import { configuration } from '../utilities/configuration';

import { discordEndpoints } from './discordEndpoints';
import { discordCType } from './discordCType';

export interface Output {
  Username: string;
  Discriminator: string;
  'User ID': string;
}

export async function confirmDiscord(
  code: string,
  did: DidUri,
  logger: BaseLogger,
) {
  logger.debug('Exchanging code for access token');

  const body = (await got
    .post(discordEndpoints.token, {
      form: {
        code,
        grant_type: 'authorization_code',
        client_id: configuration.discord.clientId,
        client_secret: configuration.discord.clientSecret,
        redirect_uri: discordEndpoints.redirectUri,
        scope: 'identify',
      },
    })
    .json()) as { access_token: string };

  logger.debug('Access token granted, fetching discord profile');

  const headers = {
    authorization: `Bearer ${body.access_token}`,
  };
  const profile = (await got(discordEndpoints.profile, {
    headers,
  }).json()) as { username: string; discriminator: string; id: string };

  logger.debug('Found Discord profile, creating claim');

  const { username, discriminator, id } = profile;

  const claimContents = {
    Username: username,
    Discriminator: discriminator,
    'User ID': id,
  };
  const claim = Claim.fromCTypeAndClaimContents(
    discordCType,
    claimContents,
    did,
  ) as IClaim & { contents: Output };

  logger.debug('Discord claim created');

  await got.post(discordEndpoints.revoke, {
    form: {
      token: body.access_token,
      client_id: configuration.discord.clientId,
      client_secret: configuration.discord.clientSecret,
    },
  });

  logger.debug('Access token revoked');

  return claim;
}
