import { CType, Did } from '@kiltprotocol/sdk-js';

import { logger } from '../utilities/logger';

import { subScanEventGenerator } from './subScan';

export type EventParams = [
  { type_name: 'AttesterOf'; value: `0x${string}` },
  { type_name: 'ClaimHashOf'; value: `0x${string}` },
  { type_name: 'CTypeHashOf'; value: `0x${string}` },
  { type_name: 'DelegationNodeIdOf'; value: `0x${string}` | null },
];

export async function* scanAttestations(fromBlock: number) {
  const eventGenerator = subScanEventGenerator(
    'attestation',
    'AttestationCreated',
    fromBlock,
  );

  for await (const event of eventGenerator) {
    const { block, blockTimestampMs, params, extrinsicHash } = event;
    const createdAt = new Date(blockTimestampMs);

    const subject = Did.fromChain(params[0].value);
    const claimHash = params[1].value;
    const cTypeId = CType.hashToId(params[2].value);
    const delegationId = params[3].value;

    const attestationInfo = {
      subject,
      claimHash,
      cTypeId,
      block,
      createdAt,
      extrinsicHash,
      delegationId,
    };
    yield attestationInfo;
  }
}
