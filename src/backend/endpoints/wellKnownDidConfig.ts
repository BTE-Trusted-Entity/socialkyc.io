import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import {
  Claim,
  RequestForAttestation,
  Attestation,
  AttestedClaim,
} from '@kiltprotocol/core';
import { domainLinkage } from '../CTypes/domainLinkage';
import { configuration } from '../utilities/configuration';
import { fromAttestedClaim } from '../utilities/domainLinkageCredential';
import { fullDidPromise } from '../utilities/fullDid';
import { assertionKeystore } from '../utilities/keystores';

async function attestDomainLinkage() {
  const claimContents = {
    id: configuration.did,
    origin: configuration.baseUri,
  };

  const claim = Claim.fromCTypeAndClaimContents(
    domainLinkage,
    claimContents,
    configuration.did,
  );

  const requestForAttestation = RequestForAttestation.fromClaim(claim);

  if (!RequestForAttestation.isIRequestForAttestation(requestForAttestation)) {
    throw new Error('Invalid request for attestation');
  }

  const { fullDid } = await fullDidPromise;

  const selfSignedRequest = await requestForAttestation.signWithDid(
    assertionKeystore,
    fullDid,
  );

  const attestation = Attestation.fromRequestAndDid(
    selfSignedRequest,
    configuration.did,
  );

  return AttestedClaim.fromRequestAndAttestation(
    selfSignedRequest,
    attestation,
  );
}

async function didConfigResource() {
  const attestedClaim = await attestDomainLinkage();

  const domainLinkageCredential = fromAttestedClaim(attestedClaim);

  return {
    '@context': 'https://identity.foundation/.well-known/did-configuration/v1',
    linked_dids: [domainLinkageCredential],
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
