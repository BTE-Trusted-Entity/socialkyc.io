import { Claim, Credential } from '@kiltprotocol/core';
import { Crypto } from '@kiltprotocol/utils';
import { DidUri, ICredentialPresentation } from '@kiltprotocol/types';
import { signPayload } from '@kiltprotocol/did';

import { configuration } from '../utilities/configuration';
import { fullDidPromise } from '../utilities/fullDid';
import { assertionSigner } from '../utilities/keystores';
import { exitOnError } from '../utilities/exitOnError';

import { domainLinkageCType } from './domainLinkageCType';
import { fromCredentialAndIssuer } from './domainLinkageCredential';

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

  const credential = Credential.fromClaim(claim);

  const { fullDid } = await fullDidPromise;

  const attestationKey = fullDid.assertionMethod?.[0];
  if (!attestationKey) {
    throw new Error('The attestation key is not defined?!?');
  }

  // TODO: does that do anything fancy or can we just use createPresentation?
  const { signature, keyUri } = await signPayload(
    fullDid,
    Crypto.coToUInt8(credential.rootHash),
    assertionSigner,
    attestationKey.id,
  );

  const selfSignedPresentation: ICredentialPresentation = {
    ...credential,
    claimerSignature: {
      signature,
      keyUri,
    },
  };

  return selfSignedPresentation;
}

export const didConfigResourcePromise = (async () => {
  await fullDidPromise;

  const credential = await attestDomainLinkage();

  const domainLinkageCredential = fromCredentialAndIssuer(
    credential,
    configuration.did as DidUri,
  );

  return {
    '@context': 'https://identity.foundation/.well-known/did-configuration/v1',
    linked_dids: [domainLinkageCredential],
  };
})();

didConfigResourcePromise.catch(exitOnError);
