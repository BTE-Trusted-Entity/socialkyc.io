import { configuration } from '../utilities/configuration';
import { paths } from '../endpoints/paths';

export const youtubeEndpoints = {
  authorize: 'https://accounts.google.com/o/oauth2/v2/auth',
  token: 'https://oauth2.googleapis.com/token',
  channel: 'https://www.googleapis.com/youtube/v3/channels',
  revoke: 'https://oauth2.googleapis.com/revoke',

  redirectUri: `${configuration.baseUri}${paths.oauth.youtube}`,
};
