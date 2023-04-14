import type { BaseLogger } from 'pino';

import got from 'got';
import * as Boom from '@hapi/boom';
import { CType, DidUri } from '@kiltprotocol/sdk-js';

import { configuration } from '../utilities/configuration';
import { ContentfulClaim } from '../utilities/sessionStorage';

import { youtubeEndpoints } from './youtubeEndpoints';
import { youtubeCType } from './youtubeCType';

export interface Output {
  'Channel Name': string;
  'Channel ID': string;
}

async function revokeAccessToken(token: string): Promise<void> {
  await got.post(youtubeEndpoints.revoke, { form: { token } });
}

export async function confirmYoutube(
  code: string,
  did: DidUri,
  logger: BaseLogger,
) {
  logger.debug('Exchanging code for access token');

  const body = (await got
    .post(youtubeEndpoints.token, {
      form: {
        code: decodeURIComponent(code),
        grant_type: 'authorization_code',
        client_id: configuration.youtube.clientId,
        client_secret: configuration.youtube.clientSecret,
        redirect_uri: youtubeEndpoints.redirectUri,
      },
    })
    .json()) as { access_token: string };

  logger.debug('Access token granted, fetching youtube channel');

  const headers = {
    authorization: `Bearer ${body.access_token}`,
  };

  const searchParams = {
    part: 'id,snippet',
    mine: 'true',
  };

  const { items } = (await got(youtubeEndpoints.channel, {
    headers,
    searchParams,
  }).json()) as { items?: Array<{ id: string; snippet: { title: string } }> };

  if (!items || items.length === 0) {
    logger.info('No Youtube channel found');

    await revokeAccessToken(body.access_token);
    logger.debug('Access token revoked');

    throw Boom.notFound('No Youtube channel found');
  }

  if (items.length > 1) {
    // User should be able to authorize only one specific channel on the OAuth screen
    logger.warn(
      'Multiple channels found, but this should never happen. As a fallback we use the first list item.',
    );
  }

  logger.debug('Found Youtube channel, creating claim');

  const claimContents = {
    'Channel Name': items[0].snippet.title,
    'Channel ID': items[0].id,
  };
  const claim: ContentfulClaim & { contents: Output } = {
    cTypeHash: CType.idToHash(youtubeCType.$id),
    contents: claimContents,
  };

  logger.debug('Youtube claim created');

  await revokeAccessToken(body.access_token);
  logger.debug('Access token revoked');

  return claim;
}
