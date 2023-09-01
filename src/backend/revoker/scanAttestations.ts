import type { AccountId32 } from '@polkadot/types/interfaces';

import { CType, Did, DidUri } from '@kiltprotocol/sdk-js';

import { subScanEventGenerator } from './subScan';

export interface ParametersEntry {
  type: string;
  type_name: string;
  value: AccountId32 | `0x${string}` | null;
}

export interface AttestationInfo {
  owner: DidUri;
  claimHash: `0x${string}`;
  cTypeId: `kilt:ctype:0x${string}`;
  block: number;
  createdAt: Date;
  extrinsicHash: `0x${string}`;
  state: 'valid' | 'revoked' | 'removed' | undefined;
}
export async function* scanAttestations(fromBlock: number) {
  const eventGenerator = subScanEventGenerator(
    'attestation',
    'AttestationCreated',
    fromBlock,
  );

  for await (const event of eventGenerator) {
    const {
      block,
      blockTimestampMs,
      params: paramsObject,
      extrinsicHash,
    } = event;
    const createdAt = new Date(blockTimestampMs);

    const parametersArray: ParametersEntry[] = [...paramsObject];

    const attesterOf = parametersArray.find((element) => {
      return element.type_name === 'AttesterOf';
    })?.value as AccountId32;
    const cTypeHash = parametersArray.find((element) => {
      return element.type_name === 'CtypeHashOf';
    })?.value as `0x${string}`;

    const claimHash = parametersArray.find((element) => {
      return element.type_name === 'ClaimHashOf';
    })?.value as `0x${string}`;

    const owner = Did.fromChain(attesterOf);
    const cTypeId = CType.hashToId(cTypeHash);

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
