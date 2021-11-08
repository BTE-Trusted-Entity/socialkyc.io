export const paths = {
  home: '/',
  confirmationHtml: '/confirmation/{key}',
  wellKnownDidConfiguration: '/.well-known/did-configuration.json',

  challenge: '/api/challenge',

  email: {
    quote: '/api/email/quote',
    requestAttestation: '/api/email/request-attestation',
    attest: '/api/email/attest',
  },

  twitter: {
    quote: '/api/twitter/quote',
    confirm: '/api/twitter/confirm',
    requestAttestation: '/api/twitter/request-attestation',
    attest: '/api/twitter/attest',
  },

  verifier: {
    requestCredential: '/api/request-credential',
    verify: '/api/verify',
  },

  staticFiles: '/{param*}',

  liveness: '/liveness',
};
