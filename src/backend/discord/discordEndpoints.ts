import { configuration } from '../utilities/configuration';
import { paths } from '../endpoints/paths';

// TODO: discord app icon, description, etc

export const discordEndpoints = {
  authorize: 'https://discord.com/api/oauth2/authorize',
  token: 'https://discord.com/api/oauth2/token',
  profile: 'https://discord.com/api/users/@me',
  revoke: 'https://discord.com/api/oauth2/token/revoke',

  redirectUri: `${configuration.baseUri}${paths.redirect.discord}`,
};
