import { CType, Did, DidUri } from '@kiltprotocol/sdk-js';

import { subScanEventGenerator } from './subScan';

export interface AttestationInfo {
  owner: DidUri;
  claimHash: `0x${string}`;
  cTypeId: `kilt:ctype:0x${string}`;
  block: number;
  createdAt: Date;
  extrinsicHash: `0x${string}`;
}
export async function* scanAttestations(fromBlock: number) {
  const eventGenerator = subScanEventGenerator(
    'attestation',
    'AttestationCreated',
    fromBlock,
  );

  for await (const event of eventGenerator) {
    const { block, blockTimestampMs, params, extrinsicHash } = event;
    const createdAt = new Date(blockTimestampMs);

    // 0th-param is 'AttesterOf'
    const owner = Did.fromChain(params[0].value);
    // 1st-param is 'CtypeHashOf'
    const claimHash = params[1].value;
    // 2nd-param is 'ClaimHashOf'
    const cTypeId = CType.hashToId(params[2].value);

    const attestationInfo = {
      owner,
      claimHash,
      cTypeId,
      block,
      createdAt,
      extrinsicHash,
      state: undefined,
    } as AttestationInfo;
    yield attestationInfo;
  }
}
