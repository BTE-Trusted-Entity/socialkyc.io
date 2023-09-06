import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { AttestationInfo, scanAttestations } from './scanAttestations';
import { readCurrentStates, shouldBeRevoked } from './stateIdentifiers';

/**
 * Generator function to gather the expired attestations issued by SocialKYC.
 *
 * Their creation date `createdAt` lets us know if they are to be revoked or removed.
 *
 * @param fromBlock decides where to start the blockchain scan.
 * @returns attestationInfo
 */
export async function* getExpiredCredentials(
  fromBlock = 0,
): AsyncGenerator<AttestationInfo> {
  // Generator for attestationInfos of credentials issued by socialKYC
  const ourAttestationsGenerator = filterOnlyAttestedByUs(
    scanAttestations(fromBlock),
  );

  for await (const attestationInfo of ourAttestationsGenerator) {
    const validityState = (await readCurrentStates([attestationInfo]))[0];

    // find the next attestation that has not been removed yet:
    if (validityState === 'removed') {
      continue;
    }

    if (!shouldBeRevoked(attestationInfo)) {
      logger.debug(
        'No more credentials younger than a year attested by SocialKYC.',
      );
      // end the generator:
      return;
    }
    yield attestationInfo;
  }
}

async function* filterOnlyAttestedByUs(
  attestationGenerator: AsyncGenerator<AttestationInfo>,
) {
  for await (const attestation of attestationGenerator) {
    if (!attestation) {
      logger.debug('No more attestations found.');
      // end the generator
      return;
    }

    const didOfAttester = attestation.owner;
    if (configuration.did === didOfAttester) {
      yield attestation;
    }
    // do nothing if DID not provided or wrong
  }
}
