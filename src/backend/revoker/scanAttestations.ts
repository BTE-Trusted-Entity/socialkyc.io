import { Did, type HexString, type IAttestation } from '@kiltprotocol/sdk-js';

import { logger } from '../utilities/logger';

import { subScanEventGenerator, type ParsedEvent } from './subScan';
import { shouldBeRevoked } from './shouldBeExpired';
import { batchQueryRevoked } from './batchQueryRevoked';

export interface AttestationInfo extends Omit<IAttestation, 'revoked'> {
  revoked: boolean | null;
  block: number;
  createdAt: Date;
}

let fromBlock = 0;

function extractParameterValue(event: ParsedEvent, parameter: string) {
  const desiredParam = event.params.find(
    (param) => param.type_name === parameter,
  );
  if (!desiredParam) {
    throw new Error(
      `Could not extract desired parameter "${parameter}" from event "${event}"`,
    );
  }
  return desiredParam.value;
}

export async function* scanAttestations() {
  const eventGenerator = subScanEventGenerator(
    'attestation',
    'AttestationCreated',
    fromBlock,
    async (events) => {
      const claimHashes = events.map((event) =>
        extractParameterValue(event, 'ClaimHashOf'),
      ) as HexString[];
      console.log('claimHashes: ', claimHashes);
      const revocationStatuses = await batchQueryRevoked(claimHashes);

      // add the revocation status as a new parameter
      events.forEach((event) => {
        const claimHash = extractParameterValue(
          event,
          'ClaimHashOf',
        ) as HexString;

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

    const owner = Did.fromChain(
      extractParameterValue(event, 'AttesterOf') as Parameters<
        typeof Did.fromChain
      >[0],
    );
    const claimHash = extractParameterValue(event, 'ClaimHashOf') as HexString;
    const cTypeHash = extractParameterValue(event, 'CtypeHashOf') as HexString;
    const delegationId = extractParameterValue(
      event,
      'Option<DelegationNodeIdOf>',
    ) as HexString | null;
    const revoked = extractParameterValue(event, 'RevocationStatus') as
      | boolean
      | null;

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
