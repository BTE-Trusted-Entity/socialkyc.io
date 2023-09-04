import { Attestation, ConfigService } from '@kiltprotocol/sdk-js';

import { logger } from '../utilities/logger';
import { configuration } from '../utilities/configuration';

import { initKilt } from '../utilities/initKilt';

import { scanAttestations, AttestationInfo } from './scanAttestations';

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
export async function* expiredCredentialsGetter(
  fromBlock = 0,
): AsyncGenerator<AttestationInfo> {
  // Generator for attestationInfos of credentials issued by socialKYC
  const ourAttestationsGenerator = filterOnlyAttestedByUs(
    scanAttestations(fromBlock),
  );

  for await (const attestationInfoStateless of ourAttestationsGenerator) {
    const attestationInfo = await assignState(attestationInfoStateless);

    // find the next attestation that has not been removed yet:
    if (attestationInfo.state === 'removed') {
      continue;
    }
    if (typeof attestationInfo.state === undefined) {
      // this should never happen
      throw new Error(
        `Could not assign a validity state for this credential ${attestationInfo.claimHash}`,
      );
    }
    const dateOfIssuance = attestationInfo.createdAt.getTime();
    const dateNow = Date.now();
    const millisecondsInAYear = new Date('1971').getTime();

    // if younger than a year
    if (dateOfIssuance > dateNow - 1 * millisecondsInAYear) {
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

// TODO:
// readCurrentState
// deduceWishedState

async function assignState(
  attestationInfo: AttestationInfo | void,
): Promise<AttestationInfo> {
  if (!attestationInfo) {
    throw new Error('attestation is empty');
  }

  attestationInfo.state = await readCurrentState(attestationInfo);

  if (!attestationInfo.state) {
    throw new Error(
      `Could not assign any state to the attestation: ${attestationInfo.claimHash}`,
    );
  }
  return attestationInfo;
}

/**
 * Reads the current state from an attestation on the blockchain.
 * @param attestationInfo
 * @returns one of the validity states: 'valid' | 'revoked' | 'removed'
 */
export async function readCurrentState(
  attestationInfo: AttestationInfo,
): Promise<AttestationInfo['state']> {
  await initKilt();
  const api = ConfigService.get('api');

  const attestationEncoded = await api.query.attestation.attestations(
    attestationInfo.claimHash,
  );
  if (attestationEncoded.isNone) {
    return 'removed';
  }

  const attestationDecoded = Attestation.fromChain(
    attestationEncoded,
    attestationInfo.claimHash,
  );

  if (attestationDecoded.revoked === false) {
    return 'valid';
  }
  if (attestationDecoded.revoked === true) {
    return 'revoked';
  }

  // Else:
  throw new Error(
    `Could not assign any state to the attestation: ${attestationInfo.claimHash}`,
  );
}
