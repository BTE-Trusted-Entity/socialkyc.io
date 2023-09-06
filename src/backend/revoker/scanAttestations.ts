import { Did, type HexString, type IAttestation } from '@kiltprotocol/sdk-js';

import { subScanEventGenerator } from './subScan';

export type EventParams = [
  { type_name: 'AttesterOf'; value: Parameters<typeof Did.fromChain>[0] },
  { type_name: 'ClaimHashOf'; value: HexString },
  { type_name: 'CTypeHashOf'; value: HexString },
  { type_name: 'DelegationNodeIdOf'; value: HexString | null },
];

export interface AttestationInfo extends Omit<IAttestation, 'revoked'> {
  block: number;
  createdAt: Date;
}

export async function* scanAttestations(fromBlock: number) {
  const eventGenerator = subScanEventGenerator(
    'attestation',
    'AttestationCreated',
    fromBlock,
  );

  for await (const event of eventGenerator) {
    const { block, blockTimestampMs } = event;
    const createdAt = new Date(blockTimestampMs);

    const params = event.params as EventParams;
    const owner = Did.fromChain(params[0].value);
    const claimHash = params[1].value;
    const cTypeHash = params[2].value;
    const delegationId = params[3].value;

    yield <AttestationInfo>{
      owner,
      claimHash,
      cTypeHash,
      delegationId,
      block,
      createdAt,
    };
  }
}
