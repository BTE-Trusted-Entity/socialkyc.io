import { supportedCTypeKeys } from '../utilities/supportedCTypes';

const types = supportedCTypeKeys.join('|');

export const paths = {
  home: '/',
  about: '/about.html',
  terms: '/terms.html',
  privacy: '/privacy.html',
  wellKnownDidConfiguration: '/.well-known/did-configuration.json',

  session: '/api/session',

  email: {
    send: '/api/email/send',
    confirm: '/api/email/confirm',
  },

  twitter: {
    claim: '/api/twitter/claim',
    confirm: '/api/twitter/confirm',
  },

  discord: {
    authUrl: '/api/discord/authUrl',
    confirm: '/api/discord/confirm',
  },

  github: {
    authUrl: '/api/github/authUrl',
    confirm: '/api/github/confirm',
  },

  twitch: {
    authUrl: '/api/twitch/authUrl',
    confirm: '/api/twitch/confirm',
  },

  telegram: {
    authUrl: '/api/telegram/authUrl',
    confirm: '/api/telegram/confirm',
  },

  youtube: {
    authUrl: '/api/youtube/authUrl',
    confirm: '/api/youtube/confirm',
  },

  redirect: {
    email: '/email/auth',
    discord: '/discord/auth',
    github: '/github/auth',
    twitch: '/twitch/auth',
    youtube: '/youtube/auth',
  },

  quote: `/api/quote/:type(${types})`,
  requestAttestation: `/api/request-attestation/:type(${types})`,
  attest: '/api/attest',

  verifier: {
    requestCredential: '/api/request-credential',
    verify: '/api/verify',
  },

  staticFiles: '/{param*}',

  liveness: '/liveness',

  test: {
    secret: '/api/test/secret',
  },
};
