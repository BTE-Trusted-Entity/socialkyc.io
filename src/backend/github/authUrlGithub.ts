import { configuration } from '../utilities/configuration';

import { githubEndpoints } from './githubEndpoints';

export async function authUrlGithub(secret: string): Promise<string> {
  const searchParams = {
    client_id: configuration.github.clientId,
    scope: 'user',
    state: secret,
    redirect_uri: githubEndpoints.redirectUri,
  };
  const url = new URL(githubEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString();
}
