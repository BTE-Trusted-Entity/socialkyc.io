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
    requestAttestation: '/api/email/request-attestation',
  },

  twitter: {
    claim: '/api/twitter/claim',
    confirm: '/api/twitter/confirm',
    requestAttestation: '/api/twitter/request-attestation',
  },

  discord: {
    authUrl: '/api/discord/authUrl',
    confirm: '/api/discord/confirm',
    requestAttestation: '/api/discord/request-attestation',
  },

  github: {
    authUrl: '/api/github/authUrl',
    confirm: '/api/github/confirm',
    requestAttestation: '/api/github/request-attestation',
  },

  twitch: {
    authUrl: '/api/twitch/authUrl',
    confirm: '/api/twitch/confirm',
    requestAttestation: '/api/twitch/request-attestation',
  },

  telegram: {
    authUrl: '/api/telegram/authUrl',
    confirm: '/api/telegram/confirm',
    requestAttestation: '/api/telegram/request-attestation',
  },

  youtube: {
    authUrl: '/api/youtube/authUrl',
    confirm: '/api/youtube/confirm',
    requestAttestation: '/api/youtube/request-attestation',
  },

  redirect: {
    email: '/email/auth',
    discord: '/discord/auth',
    github: '/github/auth',
    twitch: '/twitch/auth',
    youtube: '/youtube/auth',
  },

  quote: `/api/quote/:type(${types})`,
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
