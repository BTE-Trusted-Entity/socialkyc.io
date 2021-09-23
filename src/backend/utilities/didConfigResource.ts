import {
  Claim,
  RequestForAttestation,
  Attestation,
  AttestedClaim,
} from '@kiltprotocol/core';
import { configuration } from './configuration';
import { domainLinkage } from '../CTypes/domainLinkage';
import { fullDidPromise } from './fullDid';
import { assertionKeystore } from './keystores';
import { fromAttestedClaim } from './domainLinkageCredential';

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

export const didConfigResourcePromise = (async () => {
  const attestedClaim = await attestDomainLinkage();

  const domainLinkageCredential = fromAttestedClaim(attestedClaim);

  return {
    '@context': 'https://identity.foundation/.well-known/did-configuration/v1',
    linked_dids: [domainLinkageCredential],
  };
})();
