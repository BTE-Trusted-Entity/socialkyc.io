import {
  CType,
  type DidUri,
  type HexString,
  type ICType,
} from '@kiltprotocol/sdk-js';

import { logger } from '../../utilities/logger';

import { wholeAttestation, wholeBlock } from './fragments';
import { matchesGenerator, QUERY_SIZE } from './queryFromIndexer';

// When modifying queries, first try them out on https://indexer.kilt.io/ or https://dev-indexer.kilt.io/

function buildAttestationQueries(fromDate: Date, issuedBy: DidUri) {
  return (offset: number) => `
  query {
  attestations(
    orderBy: ID_ASC
    first: ${QUERY_SIZE}
    offset: ${offset}
    filter: {
      issuerId: {
        equalTo: "${issuedBy}"
      }
      creationBlock: { timeStamp: { greaterThan: "${fromDate.toISOString()}" } }
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

/** Expected structure of responses for queries defined above. */
interface QueriedCType {
  id: string; // Block number and ordinal number of attestation inside of it
  claimHash: HexString;
  cTypeId: ICType['$id'];
  issuerId: DidUri;
  payer: string; // account address
  valid: boolean;
  delegationID: null | DidUri;
  creationBlock: {
    id: string; // Block Ordinal Number, without punctuation
    hash: HexString;
    timeStamp: string; // ISO8601 Date String, like 2022-02-09T13:09:18.217
  };
  revocationBlock: {
    id: string; // Block Ordinal Number, without punctuation
    hash: HexString;
    timeStamp: string; // ISO8601 Date String, like 2022-02-09T13:09:18.217
  } | null;
  removalBlock: {
    id: string; // Block Ordinal Number, without punctuation
    hash: HexString;
    timeStamp: string; // ISO8601 Date String, like 2022-02-09T13:09:18.217
  } | null;
}

export async function queryAttestations(issuedBy: DidUri) {

  const entitiesGenerator = matchesGenerator<QueriedCType>(
    buildAttestationQueries(fromDate, issuedBy: DidUri),
  );

  for await (const entity of entitiesGenerator) {
    const {
      id: cTypeId,
      author,
      registrationBlock,
      definition,
      attestationsCreated,
    } = entity;

    const { id: creator } = author;
    const { $schema, ...rest } = JSON.parse(definition) as Omit<ICType, '$id'>;

    try {
      const newCType = await CTypeModel.upsert({
        id: cTypeId,
        schema: $schema,
        createdAt: new Date(registrationBlock.timeStamp + 'Z'),
        creator,
        block: registrationBlock.id,
        ...rest,
        attestationsCreated,
      });
      logger.info(
        `Added new CType to data base: ${JSON.stringify(newCType, null, 2)}`,
      );
    } catch (error) {
      logger.error(
        error,
        `Could not add cType ${cTypeId} to database. Probably bad formatted, see its definition: ${definition}`,
      );
      continue;
    }
  }
}
