import {
  Claim,
  RequestForAttestation,
  Attestation,
  Credential,
} from '@kiltprotocol/core';

import { Crypto } from '@kiltprotocol/utils';

import { configuration } from '../utilities/configuration';
import { fullDidPromise } from '../utilities/fullDid';
import { assertionKeystore } from '../utilities/keystores';
import { exitOnError } from '../utilities/exitOnError';

import { domainLinkageCType } from './domainLinkageCType';
import { fromCredential } from './domainLinkageCredential';

async function attestDomainLinkage() {
  const claimContents = {
    id: configuration.did,
    origin: configuration.baseUri,
  };

  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  const claim = Claim.fromCTypeAndClaimContents(
    domainLinkageCType,
    claimContents,
    configuration.did,
  );

  const requestForAttestation = RequestForAttestation.fromClaim(claim);

  const { fullDid } = await fullDidPromise;

  const attestationKey = fullDid.attestationKey;
  if (!attestationKey) {
    throw new Error('The attestation key is not defined?!?');
  }

  const { signature, keyUri } = await fullDid.signPayload(
    Crypto.coToUInt8(requestForAttestation.rootHash),
    assertionKeystore,
    attestationKey.id,
  );

  const selfSignedRequest = await requestForAttestation.addSignature(
    signature,
    keyUri,
  );

  const attestation = Attestation.fromRequestAndDid(
    selfSignedRequest,
    configuration.did,
  );

  return Credential.fromRequestAndAttestation(selfSignedRequest, attestation);
}

export const didConfigResourcePromise = (async () => {
  await fullDidPromise;

  const credential = await attestDomainLinkage();

  const domainLinkageCredential = fromCredential(credential);

  return {
    '@context': 'https://identity.foundation/.well-known/did-configuration/v1',
    linked_dids: [domainLinkageCredential],
  };
})();

didConfigResourcePromise.catch(exitOnError);
