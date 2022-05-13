import { configuration } from '../utilities/configuration';
import { paths } from '../endpoints/paths';

export const steamEndpoints = {
  login: 'https://steamcommunity.com/openid/login',
  profile: 'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2',

  redirectUri: `${configuration.baseUri}${paths.steam.auth}`,
};
