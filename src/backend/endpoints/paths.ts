import {
  supportedCTypeKeys,
  SupportedCTypes,
} from '../utilities/supportedCTypes';

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

  telegram: {
    confirm: '/api/telegram/confirm',
  },

  authHtml: '/auth/:type(discord|email|github|twitch|youtube)',
  authUrl: '/auth/:type(discord|github|telegram|twitch|youtube)',
  confirm: '/auth/:type(discord|github|twitch|youtube)',
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

export function generatePath(path: string, type: SupportedCTypes) {
  return path.replace(/:type.*/, type);
}
