import { ConfigService, Attestation } from '@kiltprotocol/sdk-js';

import { initKilt } from '../utilities/initKilt';

import { AttestationInfo } from './scanAttestations';

/**
 * Reads on the blockchain the current states of an Array of Attestations.
 * @param attestationInfo
 * @returns array the validity states: 'valid' | 'revoked' | 'removed'
 */
export async function readCurrentStates(
  attestationsInfo: AttestationInfo[],
): Promise<AttestationInfo['state'][]> {
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

/**
 * Decides which state an Attestation should have based on time.
 *
 * If it is younger than 1 year, it can still be valid.
 * If it is older than 1 year, it should be revoked.
 * If it is older than 2 years, it should be removed.
 *
 * @param attestationInfo
 * @returns one of the validity states: 'valid' | 'revoked' | 'removed'
 */
export function deduceWishedState(
  attestationInfo: AttestationInfo,
): AttestationInfo['state'] {
  const dateNow = Date.now();
  const millisecondsInAYear = new Date('1971').getTime();

  const removalCutoffDate = new Date(dateNow - 2 * millisecondsInAYear);
  const revocationCutoffDate = new Date(dateNow - 1 * millisecondsInAYear);

  if (attestationInfo.createdAt < removalCutoffDate) {
    return 'removed';
  }
  if (attestationInfo.createdAt < revocationCutoffDate) {
    return 'revoked';
  }
  return 'valid';
}
