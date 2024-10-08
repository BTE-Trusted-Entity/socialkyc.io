/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { HexString } from '@kiltprotocol/sdk-js';
import got from 'got';

import { configuration } from '../../utilities/configuration';

import { wholeBlock } from './fragments';
import {
  FetchedData,
  matchesGenerator,
  QUERY_SIZE,
  queryFromIndexer,
} from './queryFromIndexer';

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
interface QueriedBlock {
  id: string; // Block Ordinal Number, without punctuation
  hash: HexString;
  timeStamp: string; // ISO8601 Date String, like 2022-02-09T13:09:18.217
}

function mockBlocks(numberOfBlocks: number): QueriedBlock[] {
  return [...new Array(numberOfBlocks).keys()].reverse().map((index) => ({
    id: index.toString(),
    hash: `0x${index.toString(16)}`,
    timeStamp: new Date(index, 3, 21).toISOString(),
  }));
}

jest.mock('../../utilities/configuration', () => ({
  configuration: {
    indexer: { graphqlEndpoint: 'https://dev-indexer.kilt.io/' },
  },
}));

let postResponse: FetchedData<QueriedBlock>;
jest.mock('got', () => ({
  post: jest.fn().mockReturnValue({
    json: () => postResponse,
  }),
}));

beforeEach(() => {
  jest.mocked(got.post).mockClear();
  configuration.indexer.graphqlEndpoint = 'https://dev-indexer.kilt.io/';
});

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

      const { calls: postRequests } = jest.mocked(got.post).mock;

      expect(postRequests[0][0]).toBe(configuration.indexer.graphqlEndpoint);

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
      expect(unmatched.matches).toMatchObject([]);
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

describe('matchesGenerator()', () => {
  describe('on positive cases', () => {
    it("should only query once if all matches are on the first Indexer's response", async () => {
      const count = Math.floor(QUERY_SIZE * 0.77);

      postResponse = {
        data: {
          blocks: {
            totalCount: count,
            nodes: mockBlocks(count),
          },
        },
      };
      const buildBlockQuery = buildBlockQueries();
      const aFewMatches = matchesGenerator<QueriedBlock>(buildBlockQuery);

      for await (const match of aFewMatches) {
        expect(match).toBeDefined();
      }

      expect(got.post).toHaveBeenCalledTimes(1);
    });

    it('should continue requesting from the Indexer until querying all matches', async () => {
      const count = Math.floor(QUERY_SIZE * 3.33);
      postResponse = {
        data: {
          blocks: {
            totalCount: count,
            nodes: mockBlocks(QUERY_SIZE),
          },
        },
      };

      const buildBlockQuery = buildBlockQueries();
      const aLotOfMatches = matchesGenerator<QueriedBlock>(buildBlockQuery);

      for await (const match of aLotOfMatches) {
        expect(match).toBeDefined();
      }

      expect(got.post).toHaveBeenCalledTimes(5);

      const { calls: postRequests } = jest.mocked(got.post).mock;

      // @ts-expect-error because TS infers wrong parameters
      expect(postRequests[0][1]).toMatchObject({
        json: { query: buildBlockQuery(0) },
      });
      // @ts-expect-error because TS infers wrong parameters
      expect(postRequests[1][1]).toMatchObject({
        json: { query: buildBlockQuery(0) },
      });
      // @ts-expect-error because TS infers wrong parameters
      expect(postRequests[2][1]).toMatchObject({
        json: { query: buildBlockQuery(QUERY_SIZE) },
      });
      // @ts-expect-error because TS infers wrong parameters
      expect(postRequests[3][1]).toMatchObject({
        json: { query: buildBlockQuery(QUERY_SIZE * 2) },
      });
      // @ts-expect-error because TS infers wrong parameters
      expect(postRequests[4][1]).toMatchObject({
        json: { query: buildBlockQuery(QUERY_SIZE * 3) },
      });
    }, 10000);
  });

  describe('on negative cases', () => {
    it('should just return void if the GraphQL Endpoint is not available', async () => {
      configuration.indexer.graphqlEndpoint = 'NONE';
      postResponse = {
        data: {
          blocks: {
            totalCount: 37,
            nodes: mockBlocks(37),
          },
        },
      };

      const noMatches = matchesGenerator<QueriedBlock>((foo) => foo.toString());

      const returnValue = await noMatches.next();
      expect(returnValue.value).toBeUndefined();
      expect(returnValue.done).toBe(true);

      expect(got.post).toHaveBeenCalledTimes(0);
    });

    it('should just return void if there is no matches to a query', async () => {
      postResponse = {
        data: {
          blocks: {
            totalCount: 0,
            nodes: [],
          },
        },
      };

      const noMatches = matchesGenerator<QueriedBlock>((foo) => foo.toString());

      const returnValue = await noMatches.next();
      expect(returnValue.value).toBeUndefined();
      expect(returnValue.done).toBe(true);

      expect(got.post).toHaveBeenCalledTimes(1);
    });
  });
});
