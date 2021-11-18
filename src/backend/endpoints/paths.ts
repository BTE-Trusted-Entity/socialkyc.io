export const paths = {
  home: '/',
  confirmationHtml: '/confirmation/{secret}',
  wellKnownDidConfiguration: '/.well-known/did-configuration.json',

  session: '/api/session',

  email: {
    quote: '/api/email/quote',
    confirm: '/api/email/confirm',
    requestAttestation: '/api/email/request-attestation',
    attest: '/api/email/attest',
  },

  twitter: {
    quote: '/api/twitter/quote',
    confirm: '/api/twitter/confirm',
    requestAttestation: '/api/twitter/request-attestation',
    attest: '/api/twitter/attest',
  },

  dotsama: {
    quote: '/api/dotsama/quote',
    requestAttestation: '/api/dotsama/request-attestation',
    attest: '/api/dotsama/attest',
  },

  verifier: {
    requestCredential: '/api/request-credential',
    verify: '/api/verify',
  },

  staticFiles: '/{param*}',

  liveness: '/liveness',
};
