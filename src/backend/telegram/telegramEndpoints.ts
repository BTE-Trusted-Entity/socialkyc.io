import { configuration } from '../utilities/configuration';

export const telegramEndpoints = {
  authorize: 'https://oauth.telegram.org/embed',
  botProfile: `https://api.telegram.org/bot${configuration.telegram.token}/getMe`,
};
