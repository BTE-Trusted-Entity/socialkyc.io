import { type DidUri, type HexString, type ICType } from '@kiltprotocol/sdk-js';

import { Op } from 'sequelize';

import { CType as CTypeModel } from '../../models/ctype';

import { logger } from '../logger';

import { matchesGenerator, QUERY_SIZE } from './queryFromIndexer';
import { DidNames, wholeBlock } from './fragments';

// When modifying queries, first try them out on https://indexer.kilt.io/ or https://dev-indexer.kilt.io/

function buildCTypeQueries(fromDate: Date) {
  return (offset: number) => `
  query {
    cTypes(orderBy: ID_ASC, first: ${QUERY_SIZE}, offset: ${offset}, filter: { registrationBlock: { timeStamp: { greaterThan: "${fromDate.toISOString()}" } }}) {
      totalCount
      nodes {
        id
        author {...DidNames}
        registrationBlock {...wholeBlock}
        attestationsCreated
        attestationsRevoked
        attestationsRemoved
        validAttestations
        definition
      }
    }
  }
  ${wholeBlock}
  ${DidNames}
`;
}

/** Expected structure of responses for queries defined above. */
interface QueriedCType {
  id: ICType['$id'];
  attestationsCreated: number;
  author: {
    id: DidUri;
    web3NameId: string;
  };
  registrationBlock: {
    id: string; // Block Ordinal Number, without punctuation
    hash: HexString;
    timeStamp: string; // ISO8601 Date String, like 2022-02-09T13:09:18.217
  };
  definition: string; // stringified JSON of cType Schema
}

export async function queryCTypes() {
  const latestCType = await CTypeModel.findOne({
    order: [['createdAt', 'DESC']],
    where: {
      block: {
        [Op.not]: null,
      },
    },
  });

  const fromDate = latestCType ? latestCType.dataValues.createdAt : new Date(0);

  const entitiesGenerator = matchesGenerator<QueriedCType>(
    buildCTypeQueries(fromDate),
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
