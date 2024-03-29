import type { BaseLogger } from 'pino';

import got from 'got';
import { CType, DidUri } from '@kiltprotocol/sdk-js';

import { configuration } from '../utilities/configuration';
import { ContentfulClaim } from '../utilities/sessionStorage';

import { githubEndpoints } from './githubEndpoints';
import { githubCType } from './githubCType';

export interface Output {
  Username: string;
  'User ID': string;
}

export async function confirmGithub(
  code: string,
  did: DidUri,
  logger: BaseLogger,
) {
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

  return <ContentfulClaim & { contents: Output }>{
    cTypeHash: CType.idToHash(githubCType.$id),
    contents: claimContents,
  };
}
