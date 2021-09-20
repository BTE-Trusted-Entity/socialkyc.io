import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { KeyRelationship } from '@kiltprotocol/types';
import { configuration } from '../utilities/configuration';
import { fullDidPromise } from '../utilities/fullDid';
import { authenticationKeystore } from '../utilities/keystores';

const signingAlg = 'rs256';

function base64ToUInt8Array(base64: string) {
  return Uint8Array.from(Buffer.from(base64, 'base64'));
}

function hexToUInt8Array(hex: string) {
  return Uint8Array.from(Buffer.from(hex, 'hex'));
}

async function didConfigResource() {
  const fullDidDetails = await fullDidPromise;
  const { authentication } = KeyRelationship;

  const publicKey = fullDidDetails.getKeys(authentication)[0];

  const header = {
    alg: signingAlg,
    kid: publicKey.id,
  };

  const payload = {
    iss: configuration.did,
    sub: configuration.did,
    vc: {
      '@context': [
        'https://www.w3.org/2018/credentials/v1',
        'https://identity.foundation/.well-known/did-configuration/v1',
      ],
      credentialSubject: {
        id: configuration.did,
        origin: configuration.baseUri,
      },
      expirationDate: new Date(
        Date.now() + 1000 * 60 * 60 * 24 * 365 * 5,
      ).toString(), // 5 years
      issuanceDate: new Date().toString(),
      issuer: configuration.did,
      type: ['VerifiableCredential', 'DomainLinkageCredential'],
    },
  };

  const base64UrlHeader = Buffer.from(JSON.stringify(header)).toString(
    'base64url',
  );

  const base64UrlPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  );

  const unsignedJWT = `${base64UrlHeader}.${base64UrlPayload}`;

  const response = await authenticationKeystore.sign({
    alg: signingAlg,
    data: base64ToUInt8Array(unsignedJWT),
    publicKey: hexToUInt8Array(publicKey.publicKeyHex),
  });

  const base64UrlSignature = Buffer.from(response.data).toString('base64url');

  const signedJWT = `${base64UrlHeader}.${base64UrlPayload}.${base64UrlSignature}`;

  return {
    '@context': 'https://identity.foundation/.well-known/did-configuration/v1',
    linked_dids: [signedJWT],
  };
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  return h.response(await didConfigResource());
}

export const wellKnownDidConfig: ServerRoute = {
  method: 'GET',
  path: '/.well-known/did-configuration.json',
  handler,
};
