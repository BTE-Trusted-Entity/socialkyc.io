import { Did, type HexString, type IAttestation } from '@kiltprotocol/sdk-js';

import { subScanEventGenerator } from './subScan';
import { bulkQueryRevoked } from './stateIdentifiers';

export type EventParams = [
  { type_name: 'AttesterOf'; value: Parameters<typeof Did.fromChain>[0] },
  { type_name: 'ClaimHashOf'; value: HexString },
  { type_name: 'CTypeHashOf'; value: HexString },
  { type_name: 'DelegationNodeIdOf'; value: HexString | null },
  boolean | null, // revoked value added by our transform function
];

export interface AttestationInfo extends Omit<IAttestation, 'revoked'> {
  revoked: boolean | null;
  block: number;
  createdAt: Date;
}

export async function* scanAttestations(fromBlock: number) {
  const eventGenerator = subScanEventGenerator(
    'attestation',
    'AttestationCreated',
    fromBlock,
    async (events) => {
      const claimHashes = events.map(({ params }) => params[1].value);
      const allRevoked = await bulkQueryRevoked(claimHashes);
      events.forEach(({ params }, index) => {
        params.push(allRevoked[index]);
      });
      return events;
    },
  );

  for await (const event of eventGenerator) {
    const { block, blockTimestampMs } = event;
    const createdAt = new Date(blockTimestampMs);

    const params = event.params as EventParams;
    const owner = Did.fromChain(params[0].value);
    const claimHash = params[1].value;
    const cTypeHash = params[2].value;
    const delegationId = params[3].value;
    const revoked = params[4];

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
