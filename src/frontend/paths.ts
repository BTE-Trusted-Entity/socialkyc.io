export const paths = {
  home: '/',
  email: '/email',
  emailConfirmation: '/email/:secret',
  twitter: '/twitter',
  discord: '/discord',
  discordAuth: '/discord/:code/:secret',
  window: {
    discord: '/discord/auth',
    email: '/email/confirmation/:secret',
  },
};
