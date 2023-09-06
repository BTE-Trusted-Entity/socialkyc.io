import { ConfigService, Attestation } from '@kiltprotocol/sdk-js';

import { initKilt } from '../utilities/initKilt';

import { AttestationInfo } from './scanAttestations';

type ValidityState = 'valid' | 'revoked' | 'removed';

/**
 * Reads from the blockchain the current states of an array of Attestations.
 * @param attestationsInfo
 * @returns array of validity states
 */
export async function readCurrentStates(
  attestationsInfo: AttestationInfo[],
): Promise<ValidityState[]> {
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
