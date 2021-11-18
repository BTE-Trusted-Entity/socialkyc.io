import { ICredential, DidSignature, IClaimContents } from '@kiltprotocol/types';
import {
  DEFAULT_VERIFIABLECREDENTIAL_CONTEXT,
  DEFAULT_VERIFIABLECREDENTIAL_TYPE,
  KILT_SELF_SIGNED_PROOF_TYPE,
  KILT_VERIFIABLECREDENTIAL_TYPE,
} from '@kiltprotocol/vc-export/lib/constants.js';
import { VerifiableCredential, Proof } from '@kiltprotocol/vc-export/lib/types';

// taken from https://github.com/KILTprotocol/sdk-js/blob/develop/packages/vc-export/src/exportToVerifiableCredential.ts

const context = [
  DEFAULT_VERIFIABLECREDENTIAL_CONTEXT,
  'https://identity.foundation/.well-known/did-configuration/v1',
];

interface DomainLinkageCredential
  extends Omit<
    VerifiableCredential,
    '@context' | 'id' | 'legitimationIds' | 'credentialSubject' | 'proof'
  > {
  '@context': typeof context;
  credentialSubject: IClaimContents;
  proof: Proof;
}

export function fromCredential(input: ICredential): DomainLinkageCredential {
  const credentialSubject = {
    ...input.request.claim.contents,
    rootHash: input.request.rootHash,
  };
  const issuer = input.attestation.owner;

  // add current date bc we have no issuance date on credential
  // TODO: could we get this from block time or something?
  const issuanceDate = new Date().toISOString();
  const expirationDate = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 365 * 5,
  ).toISOString(); // 5 years

  const claimerSignature = input.request.claimerSignature as DidSignature & {
    challenge: string;
  };

  // add self-signed proof
  const proof = {
    type: KILT_SELF_SIGNED_PROOF_TYPE,
    proofPurpose: 'assertionMethod',
    verificationMethod: claimerSignature.keyId,
    signature: claimerSignature.signature,
    challenge: claimerSignature.challenge,
  };

  return {
    '@context': context,
    issuer,
    issuanceDate,
    expirationDate,
    type: [
      DEFAULT_VERIFIABLECREDENTIAL_TYPE,
      'DomainLinkageCredential',
      KILT_VERIFIABLECREDENTIAL_TYPE,
    ],
    credentialSubject,
    proof,
  };
}
