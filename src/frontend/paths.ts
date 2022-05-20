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
  twitch: '/twitch',
  twitchAuth: '/twitch/:code/:secret',
  instagram: '/instagram',
  instagramAuth: '/instagram/:code/:secret',
  telegram: '/telegram',
  youtube: '/youtube',
  youtubeAuth: '/youtube/:code/:secret',
  window: {
    email: backendPaths.email.confirmationHtml.replace('{secret}', ':secret'),
    discord: backendPaths.oauth.discord,
    github: backendPaths.oauth.github,
    twitch: backendPaths.oauth.twitch,
    youtube: backendPaths.oauth.youtube,
    instagram: backendPaths.oauth.instagram,
  },
};

export const redirectedPaths = [
  paths.emailConfirmation,
  paths.discordAuth,
  paths.githubAuth,
  paths.twitchAuth,
  paths.youtubeAuth,
  paths.instagramAuth,
];
