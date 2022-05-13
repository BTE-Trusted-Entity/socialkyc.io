import { ServerRoute } from '@hapi/hapi';

import { paths } from '../endpoints/paths';
import { configuration } from '../utilities/configuration';

import { steamEndpoints } from './steamEndpoints';

async function handler(): Promise<string> {
  const searchParams = {
    'openid.ns': 'http://specs.openid.net/auth/2.0',
    'openid.mode': 'checkid_setup',
    'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
    'openid.return_to': steamEndpoints.redirectUri,
    'openid.realm': configuration.baseUri,
  };
  const url = new URL(steamEndpoints.login);
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString() as string;
}

export const authUrlSteam: ServerRoute = {
  method: 'POST',
  path: paths.steam.authUrl,
  handler,
};
