import {
  CType,
  IAttestation,
  type DidUri,
  type HexString,
  type ICType,
} from '@kiltprotocol/sdk-js';

import { configuration } from '../../utilities/configuration';

import { wholeAttestation, wholeBlock } from './fragments';
import { matchesGenerator, QUERY_SIZE } from './queryFromIndexer';

// When modifying queries, first try them out on https://indexer.kilt.io/ or https://dev-indexer.kilt.io/

function buildAttestationQueries(fromDate: Date, untilDate: Date) {
  return (offset: number) => `
  query {
  attestations(
    orderBy: ID_ASC
    first: ${QUERY_SIZE}
    offset: ${offset}
    filter: {
      issuerId: {
        equalTo: "${configuration.did}"
      }
      creationBlock: {
        timeStamp: {
          greaterThan: "${fromDate.toISOString()}",
          lessThan: "${untilDate.toISOString()}"
        }
      }
      removalBlockExists: true
    }
  ) {
    totalCount
    nodes {
      ...wholeAttestation
    }
  }
}
  ${wholeBlock}
  ${wholeAttestation}
`;
}

interface IndexedBlock {
  id: string; // Block Ordinal Number, without punctuation
  hash: HexString;
  timeStamp: string; // ISO8601 Date String, like 2022-02-09T13:09:18.217
}

/** Expected structure of responses for queries defined above. */
interface QueriedAttestation {
  id: string; // Block number and ordinal number of attestation inside of it
  claimHash: HexString;
  cTypeId: ICType['$id'];
  issuerId: DidUri;
  payer: string; // account address
  valid: boolean;
  delegationID: null | DidUri;
  creationBlock: IndexedBlock;
  revocationBlock: IndexedBlock | null;
  removalBlock: IndexedBlock | null;
}

/** Legacy interface. */
export interface AttestationInfo extends Omit<IAttestation, 'revoked'> {
  revoked: boolean | null;
  block: number;
  createdAt: Date;
}

let fromDate = new Date(0);

export function queryExpiredAttestations() {
  const untilDate = new Date();
  untilDate.setFullYear(untilDate.getFullYear() - 1);

  const expiredAttestations = matchesGenerator<QueriedAttestation>(
    buildAttestationQueries(fromDate, untilDate),
  );

  // Save date for next query
  fromDate = untilDate;

  return attestationParser(expiredAttestations);
}

/** Transforms what an attestation generator yields.
 *  From the query interface `QueriedAttestation` to the old interface `AttestationInfo`.*/
async function* attestationParser(
  queriedAttestationsGenerator: AsyncGenerator<
    QueriedAttestation,
    void,
    unknown
  >,
) {
  for await (const queriedAttestation of queriedAttestationsGenerator) {
    const {
      creationBlock,
      revocationBlock,
      removalBlock,
      cTypeId,
      claimHash,
      issuerId,
      delegationID,
    } = queriedAttestation;

    const createdAt = new Date(creationBlock.timeStamp);
    const blockNumber = parseInt(creationBlock.id);
    const cTypeHash = CType.idToChain(cTypeId);

    // `null` if removed, `true` if revoked, `false` if valid.
    const revoked =
      removalBlock !== null ? null : revocationBlock !== null ? true : false;

    yield <AttestationInfo>{
      owner: issuerId,
      claimHash,
      cTypeHash,
      delegationId: delegationID,
      revoked,
      block: blockNumber,
      createdAt,
    };
  }
}

// TODO: add unit tests for this file
