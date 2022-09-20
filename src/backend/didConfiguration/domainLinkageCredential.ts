import {
  DidSignature,
  IClaimContents,
  ICredentialPresentation,
} from '@kiltprotocol/types';
import {
  VerifiableCredential,
  Proof,
} from '@kiltprotocol/vc-export/lib/esm/types';

/*
TODO: restore the import and remove the constants when the SDK exports them properly
import {
  DEFAULT_VERIFIABLECREDENTIAL_CONTEXT,
  DEFAULT_VERIFIABLECREDENTIAL_TYPE,
  KILT_SELF_SIGNED_PROOF_TYPE,
  KILT_VERIFIABLECREDENTIAL_TYPE,
} from '@kiltprotocol/vc-export/lib/esm/constants.js';
*/
const DEFAULT_VERIFIABLECREDENTIAL_CONTEXT =
  'https://www.w3.org/2018/credentials/v1';
const DEFAULT_VERIFIABLECREDENTIAL_TYPE = 'VerifiableCredential';
const KILT_VERIFIABLECREDENTIAL_TYPE = 'KiltCredential2020';
const KILT_SELF_SIGNED_PROOF_TYPE = 'KILTSelfSigned2020';

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

export function fromCredential(
  input: ICredentialPresentation,
): DomainLinkageCredential {
  const credentialSubject = {
    ...input.claim.contents,
    rootHash: input.rootHash,
  };

  // add current date bc we have no issuance date on credential
  // TODO: could we get this from block time or something?
  const issuanceDate = new Date().toISOString();
  const expirationDate = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 365 * 5,
  ).toISOString(); // 5 years

  const claimerSignature = input.claimerSignature as DidSignature & {
    challenge: string;
  };

  // add self-signed proof
  const proof = {
    type: KILT_SELF_SIGNED_PROOF_TYPE,
    proofPurpose: 'assertionMethod',
    verificationMethod: claimerSignature.keyUri,
    signature: claimerSignature.signature,
    challenge: claimerSignature.challenge,
  };

  return {
    '@context': context,
    issuer: input.claim.owner,
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
