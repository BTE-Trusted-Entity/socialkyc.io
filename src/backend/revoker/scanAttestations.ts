import type { AccountId32 } from '@polkadot/types/interfaces';

import { Did, type HexString, type IAttestation } from '@kiltprotocol/sdk-js';
import { hexToU8a } from '@polkadot/util';

import { logger } from '../utilities/logger';

import { ParsedEvent, subScanEventGenerator } from './subScan';
import { shouldBeRevoked } from './shouldBeExpired';
import { batchQueryRevoked } from './batchQueryRevoked';

export interface AttestationInfo extends Omit<IAttestation, 'revoked'> {
  revoked: boolean | null;
  block: number;
  createdAt: Date;
}

let fromBlock = 0;

/** Extends the `event` with the parameters parsed,
 *  so that the parameters value extraction is easier and more elegant.
 *
 * @param event
 * @returns the extended event
 */
function parseParams(event: ParsedEvent) {
  return {
    ...event,
    parsedParams: Object.fromEntries(
      event.params.map((param) => [param.type_name, param.value]),
    ),
  };
}

function getDidUriFromAccountHex(didAccount: HexString) {
  // SubScan returns some AttesterOf values as hex without the "0x" prefix
  // so we first parsed to a Uint8Array via `hexToU8a`, which can handle HexStrings with or without the prefix.
  const didU8a = hexToU8a(didAccount);

  return Did.fromChain(didU8a as AccountId32);
}

export async function* scanAttestations() {
  const eventGenerator = subScanEventGenerator(
    'attestation',
    'AttestationCreated',
    fromBlock,
    async (events) => {
      const extendedEvents = events.map(parseParams);
      const claimHashes = extendedEvents.map(
        ({ parsedParams }) => parsedParams.ClaimHashOf as HexString,
      );
      const revocationStatuses = await batchQueryRevoked(claimHashes);

      // add the revocation status as a new parameter
      extendedEvents.forEach((event) => {
        const claimHash = event.parsedParams.ClaimHashOf as HexString;

        event.params.push({
          type_name: 'RevocationStatus',
          value: revocationStatuses[claimHash],
        });
      });

      return extendedEvents;
    },
  );

  for await (const event of eventGenerator) {
    const { block, blockTimestampMs } = event;
    const createdAt = new Date(blockTimestampMs);

    if (!shouldBeRevoked({ createdAt })) {
      logger.debug('No more attestations to revoke');
      // stop here so that fromBlock contains the last expired block, and we can start from it in the next run
      return;
    }
    fromBlock = block;

    // extract the parameters
    const params = parseParams(event).parsedParams;

    const owner = getDidUriFromAccountHex(params.AttesterOf as HexString);

    const claimHash = params.ClaimHashOf as HexString;
    const cTypeHash = params.CtypeHashOf as HexString;
    const delegationId = params[
      'Option<DelegationNodeIdOf>'
    ] as HexString | null;
    const revoked = params.RevocationStatus as boolean | null;

    yield <AttestationInfo>{
      owner,
      claimHash,
      cTypeHash,
      delegationId,
      revoked,
      block,
      createdAt,
    };
  }
}
