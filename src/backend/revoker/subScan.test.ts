/**
 * @jest-environment node
 */

import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { ConfigService, connect } from '@kiltprotocol/sdk-js';
import got from 'got';

import { configuration } from '../utilities/configuration';

jest.mock('../utilities/configuration', () => ({
  configuration: { subscan: { network: 'kilt-testnet', secret: 'SECRET' } },
}));

import {
  type EventsListJSON,
  type EventsParamsJSON,
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

let postResponse: EventsListJSON | EventsParamsJSON;
jest.mock('got', () => ({
  post: jest.fn().mockReturnValue({
    json: () => postResponse,
  }),
}));

beforeEach(() => {
  jest.mocked(got.post).mockClear();
});

const moduleName = 'attestation';
const eventId = 'AttestationCreated';

describe('subScan', () => {
  describe('getEvents', () => {
    it('should query the subscan API', async () => {
      postResponse = { data: { count: 0, events: null } };

      await getEvents({
        module: moduleName,
        eventId,
        fromBlock: 10,
        page: 0,
        row: 0,
      });

      expect(got.post).toHaveBeenCalledWith(
        'https://kilt-testnet.api.subscan.io/api/v2/scan/events',
        {
          headers: { 'X-API-Key': configuration.subscan.secret },
          json: {
            module: moduleName,
            event_id: eventId,
            block_range: '10-100010',
            order: 'asc',
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
        eventId,
        fromBlock: 10,
        page: 0,
        row: 0,
      });

      expect(cTypeEvents.count).toBe(0);
      expect(cTypeEvents.events).toBeUndefined();
    });
  });

  describe('subScanEventGenerator', () => {
    it('should iterate through pages in ascending order', async () => {
      postResponse = { data: { count: 200, events: [] } };

      const eventGenerator = subScanEventGenerator(
        moduleName,
        eventId,
        0,
        async (events) => events,
      );

      for await (const event of eventGenerator) {
        expect(event).toBeDefined();
      }

      expect(got.post).toHaveBeenCalledTimes(6);
      const { calls } = jest.mocked(got.post).mock;

      // get count
      // @ts-expect-error because TS infers wrong parameters
      expect(calls[0][1]).toMatchObject({ json: { page: 0, row: 1 } });

      // get first page
      // @ts-expect-error because TS infers wrong parameters
      expect(calls[2][1]).toMatchObject({ json: { page: 0, row: 100 } });

      // get last page
      // @ts-expect-error because TS infers wrong parameters
      expect(calls[4][1]).toMatchObject({ json: { page: 1, row: 100 } });
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
      eventId,
      0,
      async (events) => events,
    );

    for await (const event of eventGenerator) {
      expect(event).toBeDefined();
    }

    expect(got.post).toHaveBeenCalledTimes(8);
    const { calls } = jest.mocked(got.post).mock;

    // @ts-expect-error because TS infers wrong parameters
    expect(calls[6][1]).toMatchObject({
      json: { block_range: '100000-200000', page: 0, row: 100 },
    });
  });
});
