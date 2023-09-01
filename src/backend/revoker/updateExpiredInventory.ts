import { Attestation, ConfigService } from '@kiltprotocol/sdk-js';

import { AttestationInfo } from './scanAttestations';
import { removeFromExpiredInventory } from './expiredInventory';

/**
 * Checks if the attestation was successfully revoked or removed.
 *
 * @param attestationsInfo Array of AttestationInfo of the credentials that should have been processed.
 * @returns
 */
export async function updateExpiredInventory(
  attestationsInfo: AttestationInfo[],
) {
  const api = ConfigService.get('api');

  const allAttestationsEncoded = await api.query.attestation.attestations.multi(
    attestationsInfo.map(({ claimHash }) => claimHash),
  );

  for (const [index, attestationEncoded] of allAttestationsEncoded.entries()) {
    const attestation = attestationsInfo[index];
    let stateWishedAfterProcess: AttestationInfo['state'] = undefined;
    let realCurrentState: AttestationInfo['state'] = undefined;

    const dateOfIssuance = attestation.createdAt.getTime();
    const dateNow = Date.now();
    const millisecondsInAYear = new Date('1971').getTime();

    if (dateOfIssuance < dateNow - 2 * millisecondsInAYear) {
      // if older than 2 years
      stateWishedAfterProcess = 'removed';
    } else if (dateOfIssuance < dateNow - 1 * millisecondsInAYear) {
      // if older than a year and younger than 1 year
      stateWishedAfterProcess = 'revoked';
    } else {
      throw new Error(`This credential should not be revoked or removed yet!
    Claim Hash: ${attestation.claimHash}`);
    }

    if (attestationEncoded.isNone) {
      realCurrentState = 'removed';
    }

    const attestationDecoded = Attestation.fromChain(
      attestationEncoded,
      attestation.claimHash,
    );

    if (attestationDecoded.revoked === false) {
      realCurrentState = 'valid';
    }
    if (attestationDecoded.revoked === true) {
      realCurrentState = 'revoked';
    }

    if (!realCurrentState || !stateWishedAfterProcess) {
      throw new Error('State could not be assigned');
    }

    if (realCurrentState === stateWishedAfterProcess) {
      removeFromExpiredInventory([attestation]);
    }
  }
}
