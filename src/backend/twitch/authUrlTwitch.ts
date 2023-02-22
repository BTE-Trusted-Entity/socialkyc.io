import { configuration } from '../utilities/configuration';

import { twitchEndpoints } from './twitchEndpoints';

export async function authUrlTwitch(secret: string): Promise<string> {
  const searchParams = {
    response_type: 'code',
    client_id: configuration.twitch.clientId,
    state: secret,
    redirect_uri: twitchEndpoints.redirectUri,
    force_verify: 'true',
  };
  const url = new URL(twitchEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString();
}
