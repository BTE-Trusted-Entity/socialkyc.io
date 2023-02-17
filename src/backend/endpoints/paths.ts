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
    quote: '/api/email/quote',
    requestAttestation: '/api/email/request-attestation',
  },

  twitter: {
    claim: '/api/twitter/claim',
    confirm: '/api/twitter/confirm',
    quote: '/api/twitter/quote',
    requestAttestation: '/api/twitter/request-attestation',
  },

  discord: {
    authUrl: '/api/discord/authUrl',
    confirm: '/api/discord/confirm',
    quote: '/api/discord/quote',
    requestAttestation: '/api/discord/request-attestation',
  },

  github: {
    authUrl: '/api/github/authUrl',
    confirm: '/api/github/confirm',
    quote: '/api/github/quote',
    requestAttestation: '/api/github/request-attestation',
  },

  twitch: {
    authUrl: '/api/twitch/authUrl',
    confirm: '/api/twitch/confirm',
    quote: '/api/twitch/quote',
    requestAttestation: '/api/twitch/request-attestation',
  },

  telegram: {
    authUrl: '/api/telegram/authUrl',
    confirm: '/api/telegram/confirm',
    quote: '/api/telegram/quote',
    requestAttestation: '/api/telegram/request-attestation',
  },

  youtube: {
    authUrl: '/api/youtube/authUrl',
    confirm: '/api/youtube/confirm',
    quote: '/api/youtube/quote',
    requestAttestation: '/api/youtube/request-attestation',
  },

  redirect: {
    email: '/email/auth',
    discord: '/discord/auth',
    github: '/github/auth',
    twitch: '/twitch/auth',
    youtube: '/youtube/auth',
  },

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
