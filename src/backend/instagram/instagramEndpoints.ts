import { configuration } from '../utilities/configuration';
import { paths } from '../endpoints/paths';

export const instagramEndpoints = {
  authorize: 'https://api.instagram.com/oauth/authorize',
  token: 'https://api.instagram.com/oauth/access_token',
  profile: 'https://graph.instagram.com',

  redirectUri: `${configuration.baseUri}${paths.oauth.instagram}`,
};
