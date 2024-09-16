/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HexString } from '@kiltprotocol/sdk-js';
import got from 'got';

import { configuration } from '../../utilities/configuration';

import {
  FetchedData,
  matchesGenerator,
  QUERY_SIZE,
  queryFromIndexer,
} from './queryFromIndexer';
import { wholeBlock } from './fragments';

jest.mock('../../utilities/configuration', () => ({
  configuration: {
    indexer: { graphqlEndpoint: 'https://dev-indexer.kilt.io/' },
  },
}));

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

function buildBlockQueries(filter?: string) {
  return (offset: number) => `
   query {
    blocks(
    orderBy: TIME_STAMP_DESC
    first: ${QUERY_SIZE}
    offset: ${offset}
    ${filter ? `filter: { ${filter} }` : ''}
  ) {
    totalCount
    nodes {
      ...wholeBlock
    }
  }
}
  ${wholeBlock}
`;
}
/** Expected structure of responses for queries defined above. */
interface IndexedBlock {
  id: string; // Block Ordinal Number, without punctuation
  hash: HexString;
  timeStamp: string; // ISO8601 Date String, like 2022-02-09T13:09:18.217
}

let postResponse: FetchedData;
jest.mock('got', () => ({
  post: jest.fn().mockReturnValue({
    json: () => postResponse,
  }),
}));

beforeEach(() => {
  jest.mocked(got.post).mockClear();
});

describe('The fundamental function to query from the Indexer', () => {
  describe('queryFromIndexer()', () => {
    describe('on positive cases', () => {
      it('should query the KILT Indexer API', async () => {
        postResponse = {
          data: {
            blocks: {
              totalCount: 7_000_000,
              nodes: [
                {
                  id: '7000000',
                  timeStamp: '2024-09-16T11:48:12',
                  hash: '0xCAFE',
                },
                {
                  id: '6999999',
                  timeStamp: '2024-09-16T10:48:12',
                  hash: '0xCAB',
                },
                {
                  id: '6999998',
                  timeStamp: '2024-09-16T9:48:12',
                  hash: '0xC10BE11A',
                },
              ],
            },
          },
        };

        const queryBlocks = buildBlockQueries()(0);

        await queryFromIndexer(queryBlocks);

        expect(got.post).toHaveBeenCalledWith(
          configuration.indexer.graphqlEndpoint,
          {
            json: {
              query: queryBlocks,
            },
          },
        );
      });
      it('should return empty array when matches count is 0', async () => {
        postResponse = {
          data: {
            blocks: {
              totalCount: 0,
              nodes: [],
            },
          },
        };

        const queryBlocks = buildBlockQueries(
          'timeStamp: { greaterThan: "3000-6-9" }',
        )(0);

        const unmatched = await queryFromIndexer(queryBlocks);

        expect(unmatched.totalCount).toBe(0);
        expect(unmatched.matches).toBeDefined();
        expect(unmatched.matches.length).toBe(0);
      });
    });
    describe('on negative cases', () => {
      it('should throw if the "totalCount" is not included on the query', async () => {
        postResponse = {
          data: {
            blocks: {
              // leave out the "totalCount"
              nodes: [],
            },
          },
        };

        await expect(queryFromIndexer('foo')).rejects.toThrow(
          'The query did not ask for total count. Please add field "totalCount" to your query.',
        );
      });
      it('should throw if the "nodes" is not included on the query', async () => {
        postResponse = {
          data: {
            blocks: {
              totalCount: 777,
              // leave out the "nodes"
            },
          },
        };

        await expect(queryFromIndexer('bar')).rejects.toThrow(
          'You need to include "nodes" as a field (with subfields) on your query to get matches.',
        );
      });
    });
  });
});

describe('The wrapper function that manages big queries to the Indexer', () => {
  describe('matchesGenerator()', () => {
    it('should continue requesting from the Indexer until querying all matches', async () => {
      postResponse = {
        data: {
          blocks: {
            totalCount: QUERY_SIZE * 3,
            nodes: [],
          },
        },
      };

      const buildBlockQuery = buildBlockQueries();
      const aLotOfMatches = matchesGenerator<IndexedBlock>(buildBlockQuery);

      for await (const match of aLotOfMatches) {
        expect(match).toBeDefined();
      }

      expect(got.post).toHaveBeenCalledTimes(4);
    }, 10000);
  });
});
