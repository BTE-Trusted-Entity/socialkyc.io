import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { scanAttestations, AttestationInfo } from './scanAttestations';
import { deduceWishedState, readCurrentStates } from './stateIdentifiers';

/**
 * Generator function to gather the old attestations issued by SocialKYC and assigns validity states.
 *
 * "Old" means longer than a calendar year.
 *
 * Their validity `state` and the their creation date `createdAt` let us know, if they are to be revoked or removed.
 *
 * If they are older than 1 year, they should be revoked.
 * If they are older than 2 years, they should be removed.
 *
 * @param fromBlock decides where to start the blockchain scan.
 * @returns `attestationInfo`s that are either `valid` or `revoked`
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

    // if younger than a year
    if (deduceWishedState(attestationInfo) === 'valid') {
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
