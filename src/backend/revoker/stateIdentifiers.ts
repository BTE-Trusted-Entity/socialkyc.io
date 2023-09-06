import { ConfigService, Attestation } from '@kiltprotocol/sdk-js';

import { initKilt } from '../utilities/initKilt';

import { AttestationInfo } from './scanAttestations';

// Union Type:
type validityState = 'valid' | 'revoked' | 'removed';

/**
 * Reads on the blockchain the current states of an Array of Attestations.
 * @param attestationInfo
 * @returns array of validity states: 'valid' | 'revoked' | 'removed'
 */
export async function readCurrentStates(
  attestationsInfo: AttestationInfo[],
): Promise<validityState[]> {
  await initKilt();
  const api = ConfigService.get('api');

  const allAttestationsEncoded = await api.query.attestation.attestations.multi(
    attestationsInfo.map(({ claimHash }) => claimHash),
  );

  return allAttestationsEncoded.map((encodedAttestation, index) => {
    if (encodedAttestation.isNone) {
      return 'removed';
    }

    const attestationDecoded = Attestation.fromChain(
      encodedAttestation,
      attestationsInfo[index].claimHash,
    );

    return attestationDecoded.revoked ? 'revoked' : 'valid';
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
