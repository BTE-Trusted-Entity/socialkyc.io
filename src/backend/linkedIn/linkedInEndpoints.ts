import { configuration } from '../utilities/configuration';
import { paths } from '../endpoints/paths';

export const linkedInEndpoints = {
  authorize: 'https://www.linkedin.com/oauth/v2/authorization',
  token: 'https://www.linkedin.com/oauth/v2/accessToken',
  profile: 'https://api.linkedin.com/v2/me',
  revoke: 'https://www.linkedin.com/oauth/v2/revoke',

  redirectUri: `${configuration.baseUri}${paths.oauth.linkedIn}`,
};
