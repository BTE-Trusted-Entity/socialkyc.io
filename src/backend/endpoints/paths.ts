export const paths = {
  home: '/',
  confirmationHtml: '/confirmation/{key}',
  wellKnownDidConfiguration: '/.well-known/did-configuration.json',

  attestEmail: '/api/attest',
  attestTwitter: '/api/attest-twitter',
  confirmTwitter: '/api/confirm-twitter',

  challenge: '/api/challenge',

  quoteEmail: '/api/quote',
  quoteTwitter: '/api/quote-twitter',

  requestAttestationEmail: '/api/request-attestation',
  requestAttestationTwitter: '/api/request-attestation-twitter',

  requestCredential: '/api/request-credential',

  verify: '/api/verify',

  staticFiles: '/{param*}',

  liveness: '/liveness',
};
