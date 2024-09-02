import { type ICType } from '@kiltprotocol/sdk-js';

import { Op } from 'sequelize';

import { CType as CTypeModel } from '../../models/ctype';

import { logger } from '../logger';

import { matchesGenerator, QUERY_SIZE } from './queryFromIndexer';

// When modifying queries, first try them out on https://indexer.kilt.io/ or https://dev-indexer.kilt.io/

function buildQueriesForAttestationsCreated() {
  return (offset: number) => `
      query {
        attestationsCreated: cTypes(orderBy: ID_ASC, first: ${QUERY_SIZE}, offset: ${offset}) {
          totalCount
          nodes {
            cTypeId: id
            attestationsCreated
            registrationBlockId
          }
        }
      }
    `;
}

/** Expected structure of responses for queries defined above. */
interface QueriedAttestationsCreated {
  cTypeId: ICType['$id'];
  attestationsCreated: number;
  registrationBlockId: string; // Block Ordinal Number, without punctuation
}

export async function updateAttestationsCreated() {
  const entitiesGenerator = matchesGenerator<QueriedAttestationsCreated>(
    buildQueriesForAttestationsCreated(),
  );

  for await (const entity of entitiesGenerator) {
    const { cTypeId, attestationsCreated } = entity;

    const cTypeToUpdate = await CTypeModel.findOne({
      where: {
        id: {
          [Op.eq]: cTypeId,
        },
        attestationsCreated: {
          [Op.ne]: attestationsCreated,
        },
      },
    });

    if (!cTypeToUpdate) {
      continue;
    }

    logger.info(
      `Updating Attestation Count of cType "${cTypeToUpdate.getDataValue('id')}" from ${cTypeToUpdate.getDataValue('attestationsCreated')} to ${attestationsCreated}`,
    );
    cTypeToUpdate.set('attestationsCreated', attestationsCreated);
    await cTypeToUpdate.save();
  }
}
