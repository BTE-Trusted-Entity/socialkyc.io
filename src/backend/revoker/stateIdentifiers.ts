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

  const attestationsTuples = allAttestationsEncoded.map(
    (encodedAttestation, index) =>
      [attestationsInfo[index], encodedAttestation] as const,
  );

  const arrayOfStates: AttestationInfo['state'][] = [];

  for (const [attestationInfo, attestationEncoded] of attestationsTuples) {
    if (attestationEncoded.isNone) {
      arrayOfStates.push('removed');
      continue;
    }

    const attestationDecoded = Attestation.fromChain(
      attestationEncoded,
      attestationInfo.claimHash,
    );

    if (attestationDecoded.revoked === false) {
      arrayOfStates.push('valid');
      continue;
    }
    if (attestationDecoded.revoked === true) {
      arrayOfStates.push('revoked');
      continue;
    }

    // Else:
    // including attestationInfo.state === undefined
    throw new Error(
      `Could not assign any state to the attestation: ${attestationInfo.claimHash}`,
    );

    // should I throw??

    arrayOfStates.push(undefined);
    continue;
  }
  return arrayOfStates;
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
