import type { IAttestedClaim } from '@kiltprotocol/types';
import { IDidDetails, IClaimContents } from '@kiltprotocol/types';
import {
  DEFAULT_VERIFIABLECREDENTIAL_CONTEXT,
  DEFAULT_VERIFIABLECREDENTIAL_TYPE,
  KILT_ATTESTED_PROOF_TYPE,
  KILT_CREDENTIAL_DIGEST_PROOF_TYPE,
  KILT_SELF_SIGNED_PROOF_TYPE,
  KILT_CREDENTIAL_CONTEXT_URL,
  KILT_VERIFIABLECREDENTIAL_TYPE,
} from '@kiltprotocol/vc-export/lib/constants';
import type {
  AttestedProof,
  CredentialDigestProof,
  Proof,
  SelfSignedProof,
} from '@kiltprotocol/vc-export/lib/types';

const WELL_KNOWN_DID_CONTEXT =
  'https://identity.foundation/.well-known/did-configuration/v1';

const WELL_KNOWN_DID_TYPE = 'DomainLinkageCredential';

interface DomainLinkageCredential {
  '@context': string[];
  issuer: IDidDetails['did'];
  issuanceDate: string;
  expirationDate: string;
  type: string[];
  credentialSubject: IClaimContents;
  proof: Proof | Proof[];
}

export function fromAttestedClaim(
  input: IAttestedClaim,
): DomainLinkageCredential {
  const { claimHashes, claimerSignature } = input.request;

  const credentialSubject = input.request.claim.contents;

  const issuer = input.attestation.owner;

  // add current date bc we have no issuance date on credential
  // TODO: could we get this from block time or something?
  const issuanceDate = new Date().toISOString();
  const expirationDate = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * 365 * 5,
  ).toISOString(); // 5 years

  const proof: Proof[] = [];

  const VC: DomainLinkageCredential = {
    '@context': [
      DEFAULT_VERIFIABLECREDENTIAL_CONTEXT,
      WELL_KNOWN_DID_CONTEXT,
      KILT_CREDENTIAL_CONTEXT_URL,
    ],
    issuer,
    issuanceDate,
    expirationDate,
    type: [
      DEFAULT_VERIFIABLECREDENTIAL_TYPE,
      WELL_KNOWN_DID_TYPE,
      KILT_VERIFIABLECREDENTIAL_TYPE,
    ],
    credentialSubject,
    proof,
  };

  // add self-signed proof
  if (claimerSignature) {
    const sSProof: SelfSignedProof = {
      type: KILT_SELF_SIGNED_PROOF_TYPE,
      proofPurpose: 'assertionMethod',
      verificationMethod: claimerSignature.keyId,
      signature: claimerSignature.signature,
      challenge: claimerSignature.challenge,
    };
    VC.proof.push(sSProof);
  }

  // add attestation proof
  const attProof: AttestedProof = {
    type: KILT_ATTESTED_PROOF_TYPE,
    proofPurpose: 'assertionMethod',
    attester: input.attestation.owner,
  };
  VC.proof.push(attProof);

  // add hashed properties proof
  const cDProof: CredentialDigestProof = {
    type: KILT_CREDENTIAL_DIGEST_PROOF_TYPE,
    proofPurpose: 'assertionMethod',
    nonces: input.request.claimNonceMap,
    claimHashes,
  };
  VC.proof.push(cDProof);

  return VC;
}
