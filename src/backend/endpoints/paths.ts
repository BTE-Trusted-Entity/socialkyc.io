import type { SupportedCType } from '../utilities/supportedCType';

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

  telegram: {
    confirm: '/api/telegram/confirm',
  },

  authHtml: '/{type}/auth',
  authUrl: '/api/auth/{type}',
  confirm: '/api/confirm/{type}',
  quote: `/api/quote/{type}`,
  requestAttestation: `/api/request-attestation/{type}`,
  attest: '/api/attest',

  verifier: {
    requestCredential: '/api/request-credential',
    verify: '/api/verify',
    rejectAttestation: '/api/reject-attestation',
  },

  staticFiles: '/{param*}',

  liveness: '/liveness',

  test: {
    secret: '/api/test/secret',
  },
};

export function generatePath(path: string, type: SupportedCType) {
  return path.replace('{type}', type);
}
