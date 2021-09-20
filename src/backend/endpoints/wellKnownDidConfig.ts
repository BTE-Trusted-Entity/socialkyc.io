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
import VCUtils from '@kiltprotocol/vc-export';
import { configuration } from '../utilities/configuration';
import { domainLinkage } from '../CTypes/domainLinkage';

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

  const attestation = Attestation.fromRequestAndDid(
    requestForAttestation,
    configuration.did,
  );

  return AttestedClaim.fromRequestAndAttestation(
    requestForAttestation,
    attestation,
  );
}

async function didConfigResource() {
  const attestedClaim = await attestDomainLinkage();
  const VC = VCUtils.fromAttestedClaim(attestedClaim);
  console.log('VC:', VC);
  return VC;

  // return {
  //   '@context': 'https://identity.foundation/.well-known/did-configuration/v1',
  //   linked_dids: [signedCredential],
  // };
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
