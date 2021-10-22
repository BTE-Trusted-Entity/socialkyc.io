export const paths = {
  home: '/',

  attestEmail: '/attest',
  attestTwitter: '/attest-twitter',
  challenge: '/challenge',
  confirmationHtml: '/confirmation/{key}',
  quoteEmail: '/quote',
  quoteTwitter: '/quote-twitter',
  requestAttestationEmail: '/request-attestation',
  requestAttestationTwitter: '/request-attestation-twitter',
  requestCredential: '/request-credential',
  verify: '/verify',
  wellKnownDidConfiguration: '/.well-known/did-configuration.json',

  staticFiles: '/{param*}',

  liveness: '/liveness',
};
