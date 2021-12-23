import {
  Claim,
  RequestForAttestation,
  Attestation,
  Credential,
} from '@kiltprotocol/core';

import { DidUtils } from '@kiltprotocol/did';
import { Crypto } from '@kiltprotocol/utils';
import { KeyRelationship } from '@kiltprotocol/types';

import { configuration } from '../utilities/configuration';
import { fullDidPromise } from '../utilities/fullDid';
import { assertionKeystore } from '../utilities/keystores';

import { domainLinkageCType } from './domainLinkageCType';
import { fromCredential } from './domainLinkageCredential';

async function attestDomainLinkage() {
  const claimContents = {
    id: configuration.did,
    origin: configuration.baseUri,
  };

  const claim = Claim.fromCTypeAndClaimContents(
    domainLinkageCType,
    claimContents,
    configuration.did,
  );

  const requestForAttestation = RequestForAttestation.fromClaim(claim);

  const { fullDid } = await fullDidPromise;

  const { signature, keyId } = await DidUtils.signWithDid(
    Crypto.coToUInt8(requestForAttestation.rootHash),
    fullDid,
    assertionKeystore,
    fullDid.getKeyIds(KeyRelationship.assertionMethod)[0],
  );

  const selfSignedRequest = await requestForAttestation.addSignature(
    signature,
    keyId,
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
