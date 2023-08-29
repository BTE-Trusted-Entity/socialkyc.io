import type { AccountId32 } from '@polkadot/types/interfaces';

import { CType, Did } from '@kiltprotocol/sdk-js';

// import { logger } from '../utilities/logger';

import { subScanEventGenerator } from './subScan';

// export type EventParams = [
//   { type_name: 'AttesterOf'; value: `0x${string}` },
//   { type_name: 'ClaimHashOf'; value: `0x${string}` },
//   { type_name: 'CTypeHashOf'; value: `0x${string}` },
//   { type_name: 'DelegationNodeIdOf'; value: `0x${string}` | null },
// ];

export interface ParametersEntry {
  type: string;
  type_name: string;
  value: AccountId32 | `0x${string}` | null;
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
    })?.value;

    const owner = Did.fromChain(attesterOf);
    const cTypeId = CType.hashToId(cTypeHash);

    const attestationInfo = {
      owner,
      claimHash,
      cTypeId,
      block,
      createdAt,
      extrinsicHash,
    };
    yield attestationInfo;
  }
}
