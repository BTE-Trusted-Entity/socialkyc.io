import { paths as backendPaths } from '../backend/endpoints/paths';

export const paths = {
  home: '/',
  email: '/email',
  emailConfirmation: '/email/:secret',
  twitter: '/twitter',
  discord: '/discord',
  discordAuth: '/discord/:code/:secret',
  github: '/github',
  githubAuth: '/github/:code/:secret',
  window: {
    email: backendPaths.email.confirmationHtml.replace('{secret}', ':secret'),
    discord: backendPaths.oauth.discord,
    github: backendPaths.oauth.github,
  },
};
