import type { AccountId32 } from '@polkadot/types/interfaces';

import { Did, type HexString, type IAttestation } from '@kiltprotocol/sdk-js';

import { logger } from '../utilities/logger';

import { subScanEventGenerator } from './subScan';
import { shouldBeRevoked } from './shouldBeExpired';
import { batchQueryRevoked } from './batchQueryRevoked';

export interface AttestationInfo extends Omit<IAttestation, 'revoked'> {
  revoked: boolean | null;
  block: number;
  createdAt: Date;
}

let fromBlock = 0;

export async function* scanAttestations() {
  const eventGenerator = subScanEventGenerator(
    'attestation',
    'AttestationCreated',
    fromBlock,
    async (events) => {
      const claimHashes = events.map(
        ({ params }) =>
          params.find((param) => param.type_name === 'ClaimHashOf')?.value,
      ) as HexString[];
      const revocationStatuses = await batchQueryRevoked(claimHashes);

      // add the revocation status as a new parameter
      events.forEach((event) => {
        const claimHash = event.params.find(
          (param) => param.type_name === 'ClaimHashOf',
        )?.value as HexString;

        event.params.push({
          type_name: 'RevocationStatus',
          value: revocationStatuses[claimHash],
        });
      });
      return events;
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
    const params = Object.fromEntries(
      event.params.map((param) => [param.type_name, param.value]),
    );
    const owner = Did.fromChain(params.AttesterOf as AccountId32);
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
