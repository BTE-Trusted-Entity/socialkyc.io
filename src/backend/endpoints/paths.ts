export const paths = {
  home: '/',
  about: '/about.html',
  terms: '/terms.html',
  privacy: '/privacy.html',
  wellKnownDidConfiguration: '/.well-known/did-configuration.json',

  session: '/api/session',

  email: {
    quote: '/api/email/quote',
    confirm: '/api/email/confirm',
    requestAttestation: '/api/email/request-attestation',
    attest: '/api/email/attest',
    confirmationHtml: '/email/confirmation/{secret}',
  },

  twitter: {
    quote: '/api/twitter/quote',
    confirm: '/api/twitter/confirm',
    requestAttestation: '/api/twitter/request-attestation',
    attest: '/api/twitter/attest',
  },

  discord: {
    authUrl: '/api/discord/authUrl',
    confirm: '/api/discord/confirm',
    quote: '/api/discord/quote',
    requestAttestation: '/api/discord/request-attestation',
    attest: '/api/discord/attest',
  },

  github: {
    authUrl: '/api/github/authUrl',
    confirm: '/api/github/confirm',
    quote: '/api/github/quote',
    requestAttestation: '/api/github/request-attestation',
    attest: '/api/github/attest',
  },

  twitch: {
    authUrl: '/api/twitch/authUrl',
    confirm: '/api/twitch/confirm',
    quote: '/api/twitch/quote',
    requestAttestation: '/api/twitch/request-attestation',
    attest: '/api/twitch/attest',
  },

  telegram: {
    authUrl: '/api/telegram/authUrl',
    confirm: '/api/telegram/confirm',
    quote: '/api/telegram/quote',
    requestAttestation: '/api/telegram/request-attestation',
    attest: '/api/telegram/attest',
  },

  youtube: {
    authUrl: '/api/youtube/authUrl',
    confirm: '/api/youtube/confirm',
    quote: '/api/youtube/quote',
    requestAttestation: '/api/youtube/request-attestation',
    attest: '/api/youtube/attest',
  },

  instagram: {
    authUrl: '/api/instagram/authUrl',
    confirm: '/api/instagram/confirm',
    quote: '/api/instagram/quote',
    requestAttestation: '/api/instagram/request-attestation',
    attest: '/api/instagram/attest',
  },
  oauth: {
    discord: '/discord/auth',
    github: '/github/auth',
    twitch: '/twitch/auth',
    youtube: '/youtube/auth',
    instagram: '/instagram/auth',
  },

  verifier: {
    requestCredential: '/api/request-credential',
    verify: '/api/verify',
  },

  staticFiles: '/{param*}',

  liveness: '/liveness',
};
