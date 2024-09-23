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
  AttestationInfo,
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
      it("should, on the App's start, request attestations from 1970 until a year ago from the Indexer", async () => {
        const timeZero = new Date(0);
        const aYearAgo = new Date(frozenNow.valueOf());
        aYearAgo.setFullYear(aYearAgo.getFullYear() - 1);

        // check the start value of `fromDate`
        expect(fromDate).toEqual(timeZero);

        const count = Math.floor(QUERY_SIZE * 0.2);
        postResponse = {
          data: {
            blocks: {
              totalCount: count,
              nodes: mockAttestations(count).map((b) => ({ ...b })),
            },
          },
        };
        const aFewMatches = queryExpiredAttestations();

        for await (const match of aFewMatches) {
          expect(match).toBeDefined();
        }

        expect(got.post).toHaveBeenCalled();

        const buildAttestationQuery = buildAttestationQueries(
          timeZero,
          aYearAgo,
        );

        const { calls: postRequests } = jest.mocked(got.post).mock;

        // @ts-expect-error because TS infers wrong parameters
        expect(postRequests[0][1]).toMatchObject({
          json: { query: buildAttestationQuery(0) },
        });
      });

      it('should request from the Indexer using the expected queries', async () => {
        postResponse = {
          data: {
            blocks: {
              totalCount: Math.floor(QUERY_SIZE * 3.33),
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

      it("should yield attestations in the 'AttestationInfo' interface", async () => {
        const cousinNumbers = [1, 2, 3, 5, 7, 13];

        const mockedMatches: QueriedAttestation[] = cousinNumbers.map((n) => ({
          id: `000${n}-1`,
          claimHash: `0xBE11AC10000${n}`,
          cTypeId: `kilt:ctype:0xC10BE11A`,
          issuerId: 'did:kilt:4_yourFavoriteGod',
          delegationID: null,
          payer: 'PapaStaat',
          valid: true,
          creationBlock: {
            id: `000${n}`,
            hash: `0x123456789ABCDEF000${n}`,
            timeStamp: new Date(n, 3, 21).toISOString(),
          },
          revocationBlock: null,
          removalBlock: null,
        }));

        const expectedYields: AttestationInfo[] = cousinNumbers.map((n) => ({
          owner: 'did:kilt:4_yourFavoriteGod',
          claimHash: `0xBE11AC10000${n}`,
          cTypeHash: `0xC10BE11A`,
          delegationId: null,
          revoked: false,
          block: n,
          createdAt: new Date(n, 3, 21),
        }));

        postResponse = {
          data: {
            blocks: {
              totalCount: cousinNumbers.length,
              nodes: mockedMatches.map((m) => ({ ...m })),
            },
          },
        };

        const someAttestations = queryExpiredAttestations();

        let index = 0;
        for await (const match of someAttestations) {
          expect(match).toEqual(expectedYields.at(index));
          index++;
        }
      });
    });
  });
});
