/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService, connect } from '@kiltprotocol/sdk-js';
import got from 'got';

import { configuration } from '../utilities/configuration';

import {
  type EventsResponseJson,
  getEvents,
  subScanEventGenerator,
} from './subScan';

const api = {
  query: {
    system: {
      number: () => ({ toNumber: () => 12345 }),
    },
  },
} as unknown as Awaited<ReturnType<typeof connect>>;
ConfigService.set({ api });

let postResponse: EventsResponseJson;
jest.mock('got', () => ({
  post: jest.fn().mockReturnValue({
    json: () => postResponse,
  }),
}));

beforeEach(() => {
  jest.mocked(got.post).mockClear();
});

const moduleName = 'ctype';
const call = 'CTypeCreated';

describe('subScan', () => {
  describe('getEvents', () => {
    it('should query the subscan API', async () => {
      postResponse = { data: { count: 0, events: null } };

      await getEvents({
        module: moduleName,
        call,
        fromBlock: 10,
        page: 0,
        row: 0,
      });

      expect(got.post).toHaveBeenCalledWith(
        'https://kilt-testnet.api.subscan.io/api/scan/events',
        {
          headers: { 'X-API-Key': configuration.subscan.secret },
          json: {
            module: moduleName,
            call,
            block_range: '10-100010',
            page: 0,
            row: 0,
            finalized: true,
          },
        },
      );
    });

    it('should return the count when no events exist', async () => {
      postResponse = { data: { count: 0, events: null } };

      const cTypeEvents = await getEvents({
        module: moduleName,
        call,
        fromBlock: 10,
        page: 0,
        row: 0,
      });

      expect(cTypeEvents.count).toBe(0);
      expect(cTypeEvents.events).toBeUndefined();
    });

    it('should return parsed events in reverse order', async () => {
      postResponse = {
        data: {
          count: 2,
          events: [
            {
              params: '[{ "fake": "JSON" }]',
              block_num: 123,
              block_timestamp: 123_456,
              extrinsic_hash: '0xCAFECAFE',
            },
            {
              params: '[{ "JSON": "fake" }]',
              block_num: 789,
              block_timestamp: 789_123,
              extrinsic_hash: '0xFACEFACE',
            },
          ],
        },
      };

      const cTypeEvents = await getEvents({
        module: moduleName,
        call,
        fromBlock: 10,
        page: 0,
        row: 0,
      });

      expect(cTypeEvents.count).toBe(2);
      expect(cTypeEvents.events).toEqual([
        {
          params: [{ JSON: 'fake' }],
          block: 789,
          blockTimestampMs: 789_123_000,
          extrinsicHash: '0xFACEFACE',
        },
        {
          params: [{ fake: 'JSON' }],
          block: 123,
          blockTimestampMs: 123_456_000,
          extrinsicHash: '0xCAFECAFE',
        },
      ]);
    });
  });

  describe('subScanEventGenerator', () => {
    it('should iterate through pages in reverse order', async () => {
      postResponse = { data: { count: 200, events: [] } };

      const eventGenerator = subScanEventGenerator(
        moduleName,
        call,
        0,
        async (events) => events,
      );

      for await (const event of eventGenerator) {
        expect(event).toBeDefined();
      }

      expect(got.post).toHaveBeenCalledTimes(3);
      const { calls } = jest.mocked(got.post).mock;

      // get count
      // @ts-expect-error because TS infers wrong parameters
      expect(calls[0][1]).toMatchObject({ json: { page: 0, row: 1 } });

      // get last page
      // @ts-expect-error because TS infers wrong parameters
      expect(calls[1][1]).toMatchObject({ json: { page: 1, row: 100 } });

      // get first page
      // @ts-expect-error because TS infers wrong parameters
      expect(calls[2][1]).toMatchObject({ json: { page: 0, row: 100 } });
    });

    it('should yield events in reverse order', async () => {
      jest
        .mocked(got.post)
        .mockReturnValueOnce({
          // @ts-expect-error but the code doesn’t care about the other members
          json: () => ({ data: { count: 200 } }),
        })
        .mockReturnValueOnce({
          // @ts-expect-error but the code doesn’t care about the other members
          json: () => ({
            data: {
              count: 200,
              events: [
                {
                  block_timestamp: 1,
                  params: '"JSON"',
                  extrinsic_hash: '0xCAFECAFE',
                },
                {
                  block_timestamp: 0,
                  params: '"JSON"',
                  extrinsic_hash: '0xFACEFACE',
                },
              ],
            },
          }),
        })
        .mockReturnValueOnce({
          // @ts-expect-error but the code doesn’t care about the other members
          json: () => ({
            data: {
              count: 200,
              events: [
                {
                  block_timestamp: 3,
                  params: '"JSON"',
                  extrinsic_hash: '0xCAFECAFE',
                },
                {
                  block_timestamp: 2,
                  params: '"JSON"',
                  extrinsic_hash: '0xFACEFACE',
                },
              ],
            },
          }),
        });

      const eventGenerator = subScanEventGenerator(
        moduleName,
        call,
        0,
        async (events) => events,
      );

      const events = [];
      for await (const event of eventGenerator) {
        events.push(event);
      }

      const timestamps = events.map(({ blockTimestampMs }) => blockTimestampMs);
      expect(timestamps).toEqual([0, 1000, 2000, 3000]);
    });
  });
  it('should get events in batches if current block is higher than block range', async () => {
    const api = {
      query: {
        system: {
          number: () => ({ toNumber: () => 150000 }),
        },
      },
    } as unknown as Awaited<ReturnType<typeof connect>>;
    ConfigService.set({ api });

    postResponse = { data: { count: 100, events: [] } };

    const eventGenerator = subScanEventGenerator(
      moduleName,
      call,
      0,
      async (events) => events,
    );

    for await (const event of eventGenerator) {
      expect(event).toBeDefined();
    }

    expect(got.post).toHaveBeenCalledTimes(4);
    const { calls } = jest.mocked(got.post).mock;

    // @ts-expect-error because TS infers wrong parameters
    expect(calls[3][1]).toMatchObject({
      json: { block_range: '100000-200000', page: 0, row: 100 },
    });
  });
});
