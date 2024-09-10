import got from 'got';

import { configuration } from '../../utilities/configuration';
import { logger } from '../../utilities/logger';
import { sleep } from '../../utilities/sleep';

const { indexer } = configuration;

const QUERY_INTERVAL_MS = 2000;
export const QUERY_SIZE = 100;

// /** Example Query. */
// const queryBlocks = `
//   query {
//     blocks(orderBy: TIME_STAMP_DESC, first: 3) {
//     totalCount
//       nodes {
//         id
//         timeStamp
//         hash
//       }
//     }
//   }
// `;

interface FetchedData {
  data: Record<
    string,
    {
      totalCount?: number;
      nodes?: Array<Record<string, unknown>>;
    }
  >;
}

export async function queryFromIndexer(query: string) {
  logger.debug(
    `Querying from GraphQL under ${indexer.graphqlEndpoint}, using this payload: ${query} `,
  );
  const { data } = await got
    .post(indexer.graphqlEndpoint, {
      json: {
        query,
      },
    })
    .json<FetchedData>();

  const entities = Object.entries(data);

  const [name, { totalCount, nodes: matches }] = entities[0];

  if (entities.length > 1) {
    logger.error(
      `Please, avoid multiple queries in a single request. Processing just '${name}' from here.`,
    );
  }

  if (totalCount === undefined) {
    throw new Error(
      'The query did not ask for total count. Please add field "totalCount" to your query.',
    );
  }
  if (matches === undefined) {
    throw new Error(
      'You need to include "nodes" as a field (with subfields) on your query to get matches.',
    );
  }
  logger.info(
    `Completed querying '${name}' from GraphQL under ${indexer.graphqlEndpoint}.`,
  );

  logger.info(
    `Got ${matches.length} out of ${totalCount} '${name}' matching query.`,
  );

  return { totalCount, matches };
}

export async function* matchesGenerator<ExpectedQueryResults>(
  buildQuery: (offset: number) => string,
): AsyncGenerator<ExpectedQueryResults, void> {
  if (indexer.graphqlEndpoint === 'NONE') {
    return;
  }
  const query = buildQuery(0);
  const { totalCount, matches } = await queryFromIndexer(query);

  if (totalCount === 0) {
    logger.debug(
      `The Indexed Data under "${indexer.graphqlEndpoint}" has no matches for query: ${query}.`,
    );
    return;
  }

  if (totalCount === matches.length) {
    for (const match of matches) {
      yield match as ExpectedQueryResults;
    }
    return;
  }

  for (let offset = 0; offset < totalCount; offset += QUERY_SIZE) {
    const { matches } = await queryFromIndexer(buildQuery(offset));

    for (const match of matches) {
      yield match as ExpectedQueryResults;
    }
    await sleep(QUERY_INTERVAL_MS);
  }
}
