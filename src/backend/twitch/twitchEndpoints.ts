import { configuration } from '../utilities/configuration';
import { generatePath, paths } from '../endpoints/paths';

export const twitchEndpoints = {
  authorize: 'https://id.twitch.tv/oauth2/authorize',
  token: 'https://id.twitch.tv/oauth2/token',
  profile: 'https://api.twitch.tv/helix/users',
  revoke: 'https://id.twitch.tv/oauth2/revoke',

  redirectUri: `${configuration.baseUri}${generatePath(
    paths.authHtml,
    'twitch',
  )}`,
};
