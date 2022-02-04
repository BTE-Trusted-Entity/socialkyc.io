import { paths as backendPaths } from '../backend/endpoints/paths';

export const paths = {
  home: '/',
  email: '/email',
  emailConfirmation: '/email/:secret',
  twitter: '/twitter',
  discord: '/discord',
  discordAuth: '/discord/:code/:secret',
  window: {
    discord: backendPaths.discord.authHtml,
    email: backendPaths.email.confirmationHtml.replace('{secret}', ':secret'),
  },
};
