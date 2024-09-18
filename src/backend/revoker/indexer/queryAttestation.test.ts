/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { DidUri } from '@kiltprotocol/sdk-js';
import got from 'got';

import { configuration } from '../../utilities/configuration';

import { FetchedData, QUERY_SIZE } from './queryFromIndexer';
import {
  buildAttestationQueries,
  queryExpiredAttestations,
  QueriedAttestation,
  fromDate,
} from './queryAttestations';

const frozenNow = new Date();

beforeAll(() => {
  // Fake only the Date
  jest.useFakeTimers({
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
    now: frozenNow,
  });
});
afterAll(() => {
  jest.restoreAllMocks();
  jest.useRealTimers();
});

jest.mock('../../utilities/configuration', () => ({
  configuration: {
    indexer: { graphqlEndpoint: 'https://dev-indexer.kilt.io/' },
  },
}));

let postResponse: FetchedData;
jest.mock('got', () => ({
  post: jest.fn().mockReturnValue({
    json: () => postResponse,
  }),
}));

beforeEach(() => {
  jest.mocked(got.post).mockClear();
  configuration.indexer.graphqlEndpoint = 'https://dev-indexer.kilt.io/';
});

function mockAttestations(numberOfAttestations: number) {
  const mockedAttestations: QueriedAttestation[] = [];

  for (let index = numberOfAttestations; index > 0; index--) {
    mockedAttestations.push({
      id: index.toString(),
      claimHash: `0x${index.toString(16)}`,
      cTypeId: `kilt:ctype:0x${index.toString(16)}`,
      issuerId: configuration.did as DidUri,
      delegationID: null,
      payer: 'PapaStaat',
      valid: true,
      creationBlock: {
        id: index.toString(),
        hash: `0x${index.toString(16)}`,
        timeStamp: new Date(index, 3, 21).toISOString(),
      },
      revocationBlock: null,
      removalBlock: null,
    });
  }

  return mockedAttestations;
}

describe('The function that queries the old attestations issued by SocialKYC from the Indexer', () => {
  describe('queryExpiredAttestations()', () => {
    describe('on positive cases', () => {
      it('should query the KILT Indexer API', async () => {
        const count = 3;
        postResponse = {
          data: {
            attestations: {
              totalCount: count,
              nodes: mockAttestations(count).map((a) => ({ ...a })),
            },
          },
        };

        const aFewAttestations = queryExpiredAttestations();

        for await (const match of aFewAttestations) {
          expect(match).toBeDefined();
        }

        const { calls: postRequests } = jest.mocked(got.post).mock;

        expect(postRequests[0][0]).toBe(configuration.indexer.graphqlEndpoint);
      });
      it("should only query once if all matches are on the first Indexer's response", async () => {
        const count = Math.floor(QUERY_SIZE * 0.77);

        postResponse = {
          data: {
            blocks: {
              totalCount: count,
              nodes: mockAttestations(count).map((a) => ({ ...a })),
            },
          },
        };
        const aFewAttestations = queryExpiredAttestations();

        for await (const match of aFewAttestations) {
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
              nodes: mockAttestations(QUERY_SIZE).map((b) => ({ ...b })),
            },
          },
        };
        const aLotOfAttestations = queryExpiredAttestations();

        for await (const match of aLotOfAttestations) {
          expect(match).toBeDefined();
        }

        expect(got.post).toHaveBeenCalledTimes(5);
      }, 10000);
      it('should use request from the Indexer the expected query', async () => {
        const count = Math.floor(QUERY_SIZE * 3.33);
        postResponse = {
          data: {
            blocks: {
              totalCount: count,
              nodes: mockAttestations(QUERY_SIZE).map((b) => ({ ...b })),
            },
          },
        };
        const aLotOfAttestations = queryExpiredAttestations();

        for await (const match of aLotOfAttestations) {
          expect(match).toBeDefined();
        }

        expect(got.post).toHaveBeenCalledTimes(5);

        // `fromDate` is only 0 on the app's start
        // const timeZero = new Date(0);
        const aYearAgo = new Date(frozenNow.valueOf());
        aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);

        const buildAttestationQuery = buildAttestationQueries(
          fromDate,
          aYearAgo,
        );

        const { calls: postRequests } = jest.mocked(got.post).mock;

        // @ts-expect-error because TS infers wrong parameters
        expect(postRequests[0][1]).toMatchObject({
          json: { query: buildAttestationQuery(0) },
        });
        // @ts-expect-error because TS infers wrong parameters
        expect(postRequests[1][1]).toMatchObject({
          json: { query: buildAttestationQuery(0) },
        });
        // @ts-expect-error because TS infers wrong parameters
        expect(postRequests[2][1]).toMatchObject({
          json: { query: buildAttestationQuery(QUERY_SIZE) },
        });
        // @ts-expect-error because TS infers wrong parameters
        expect(postRequests[3][1]).toMatchObject({
          json: { query: buildAttestationQuery(QUERY_SIZE * 2) },
        });
        // @ts-expect-error because TS infers wrong parameters
        expect(postRequests[4][1]).toMatchObject({
          json: { query: buildAttestationQuery(QUERY_SIZE * 3) },
        });
      }, 10000);
    });
    describe('on negative cases', () => {
      it('should just return void if there is no matches to a query', async () => {
        postResponse = {
          data: {
            blocks: {
              totalCount: 0,
              nodes: [],
            },
          },
        };
        const noMatches = queryExpiredAttestations();

        const returnValue = await noMatches.next();
        expect(returnValue.value).toBeUndefined();
        expect(returnValue.done).toBe(true);

        expect(got.post).toHaveBeenCalledTimes(1);
      });
    });
  });
});
