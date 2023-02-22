import { configuration } from '../utilities/configuration';

import { discordEndpoints } from './discordEndpoints';

export async function authUrlDiscord(secret: string): Promise<string> {
  const searchParams = {
    response_type: 'code',
    client_id: configuration.discord.clientId,
    prompt: 'consent',
    scope: 'identify',
    state: secret,
    redirect_uri: discordEndpoints.redirectUri,
  };
  const url = new URL(discordEndpoints.authorize);
  url.search = new URLSearchParams(searchParams).toString();
  return url.toString();
}
