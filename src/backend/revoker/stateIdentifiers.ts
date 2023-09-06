import { Attestation, ConfigService } from '@kiltprotocol/sdk-js';

import { initKilt } from '../utilities/initKilt';

import { AttestationInfo } from './scanAttestations';

/**
 * Queries the revoked status of an array of attestations from the blockchain in bulk
 * @param attestationsInfo
 * @returns Matching array of revoked values
 */
export async function bulkQueryRevoked(attestationsInfo: AttestationInfo[]) {
  await initKilt();
  const api = ConfigService.get('api');

  const allAttestationsEncoded = await api.query.attestation.attestations.multi(
    attestationsInfo.map(({ claimHash }) => claimHash),
  );

  return allAttestationsEncoded.map((encodedAttestation, index) => {
    if (encodedAttestation.isNone) {
      return null;
    }

    return Attestation.fromChain(
      encodedAttestation,
      attestationsInfo[index].claimHash,
    ).revoked;
  });
}

export function shouldBeRemoved({ createdAt }: { createdAt: Date }) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 2); // remove attestations older than 2 years
  return createdAt < cutoff;
}

export function shouldBeRevoked({ createdAt }: { createdAt: Date }) {
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - 1); // revoke attestations older than 1 year
  return createdAt < cutoff;
}
