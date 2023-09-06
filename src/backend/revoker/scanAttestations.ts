import { CType, Did, DidUri, HexString } from '@kiltprotocol/sdk-js';

import { subScanEventGenerator } from './subScan';

export interface AttestationInfo {
  owner: DidUri;
  claimHash: HexString;
  cTypeId: `kilt:ctype:0x${string}`;
  block: number;
  createdAt: Date;
  extrinsicHash: HexString;
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

    yield <AttestationInfo>{
      owner,
      claimHash,
      cTypeId,
      block,
      createdAt,
      extrinsicHash,
    };
  }
}
