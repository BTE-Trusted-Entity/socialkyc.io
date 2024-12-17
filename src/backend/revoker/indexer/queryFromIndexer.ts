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

export interface FetchedData<ExpectedQueryResults> {
  data: Record<
    string,
    {
      totalCount?: number;
      nodes?: Array<ExpectedQueryResults>;
    }
  >;
}

/** The fundamental function to query from the Indexer. */
export async function queryFromIndexer<ExpectedQueryResults>(query: string) {
  logger.debug(
    `Querying from GraphQL under ${indexer.graphqlEndpoint}, using this payload: ${query} `,
  );

  const responsePromise = got.post(indexer.graphqlEndpoint, {
    json: {
      query,
    },
  });

  // handle bad responses
  try {
    await responsePromise;
  } catch (error) {
    logger.error(
      `Error response coming from ${indexer.graphqlEndpoint}: ${JSON.stringify(error, null, 2)}`,
    );
    logger.info(`Continuing as if there where no matches to the query.`);
    return {
      totalCount: 0,
      matches: Array.of<ExpectedQueryResults>(),
    };
  }

  // handle good responses
  const { data } =
    await responsePromise.json<FetchedData<ExpectedQueryResults>>();

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

/** The wrapper function that manages big queries to the Indexer. */
export async function* matchesGenerator<ExpectedQueryResults>(
  buildQuery: (offset: number) => string,
): AsyncGenerator<ExpectedQueryResults, void> {
  if (indexer.graphqlEndpoint === 'NONE') {
    return;
  }
  const query = buildQuery(0);
  const { totalCount, matches } =
    await queryFromIndexer<ExpectedQueryResults>(query);

  if (totalCount === 0) {
    logger.debug(
      `The Indexed Data under "${indexer.graphqlEndpoint}" has no matches for query: ${query}.`,
    );
    return;
  }

  if (totalCount === matches.length) {
    for (const match of matches) {
      yield match;
    }
    return;
  }

  for (let offset = 0; offset < totalCount; offset += QUERY_SIZE) {
    const { matches } = await queryFromIndexer<ExpectedQueryResults>(
      buildQuery(offset),
    );

    for (const match of matches) {
      yield match;
    }
    await sleep(QUERY_INTERVAL_MS);
  }
}
