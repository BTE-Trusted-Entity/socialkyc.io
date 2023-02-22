import { configuration } from '../utilities/configuration';

import { youtubeEndpoints } from './youtubeEndpoints';

export async function authUrlYoutube(secret: string): Promise<string> {
  const searchParams = {
    scope: 'https://www.googleapis.com/auth/youtube.readonly',
    access_type: 'offline',
    include_granted_scopes: 'true',
    state: secret,
    redirect_uri: youtubeEndpoints.redirectUri,
    response_type: 'code',
    client_id: configuration.youtube.clientId,
  };
  const url = new URL(youtubeEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString();
}
