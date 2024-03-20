import got from 'got';

import { ConfigService } from '@kiltprotocol/sdk-js';

import { configuration } from '../utilities/configuration';
import { logger } from '../utilities/logger';
import { sleep } from '../utilities/sleep';

const { subscan } = configuration;

const SUBSCAN_MAX_ROWS = 100;
const QUERY_INTERVAL_MS = 1000;
const BLOCK_RANGE_SIZE = 100_000;

const subscanAPI = `https://${subscan.network}.api.subscan.io`;
const eventsListURL = `${subscanAPI}/api/v2/scan/events`;
const eventsParamsURL = `${subscanAPI}/api/scan/event/params`;
const headers = {
  'X-API-Key': subscan.secret,
};

/**
 * Structure of SubScan responses from `/api/v2/scan/events`.
 */
export interface EventsListJSON {
  code?: number;
  data: {
    count: number;
    events:
      | {
          block_timestamp: number; // UNIX-time in seconds
          event_id: string;
          event_index: string;
          extrinsic_hash: string;
          extrinsic_index: string;
          finalized: true;
          id: number;
          module_id: string;
          phase: number;
        }[]
      | null;
  };
  generated_at?: number;
  message?: string;
}

/**
 * Structure of SubScan responses from `/api/scan/event/params`.
 */
export interface EventsParamsJSON {
  code: number;
  data: {
    event_index: string;
    params: {
      name?: string;
      type?: string;
      type_name: string;
      value: unknown;
    }[];
  }[];
  generated_at: number;
  message: string;
}

export async function getEvents({
  fromBlock,
  toBlock,
  row = SUBSCAN_MAX_ROWS,
  eventId,
  ...parameters
}: {
  module: string; // Pallet name
  eventId: string; // Event emitted
  fromBlock: number;
  toBlock?: number;
  page: number;
  row?: number;
}) {
  const payloadForEventsListRequest = {
    ...parameters,
    event_id: eventId,
    block_range: `${fromBlock}-${toBlock ?? fromBlock + BLOCK_RANGE_SIZE}`,
    order: 'asc',
    row,
    finalized: true,
  };

  logger.debug(
    'payloadForEventsListRequest: ' +
      JSON.stringify(payloadForEventsListRequest, null, 2),
  );

  if (parameters.page >= 100) {
    throw new Error(
      `Page ${parameters.page} exceeds Subscan's paging limit of 100.`,
    );
  }

  const {
    data: { count, events },
  } = await got
    .post(eventsListURL, { headers, json: payloadForEventsListRequest })
    .json<EventsListJSON>();

  if (!events) {
    return { count };
  }

  const eventIndices = events.map((event) => event.event_index);

  const payloadForEventsParamsRequest = { event_index: eventIndices };
  logger.debug(
    'payloadForEventsParamsRequest: ' +
      JSON.stringify(payloadForEventsParamsRequest, null, 2),
  );

  const { data: eventsParameters } = await got
    .post(eventsParamsURL, { headers, json: payloadForEventsParamsRequest })
    .json<EventsParamsJSON>();

  const parsedEvents = events.map(
    ({ event_index, block_timestamp, extrinsic_hash }) => {
      // Block number
      const block = parseInt(event_index.split('-')[0]);

      const params = eventsParameters.find(
        (detailed) => detailed.event_index === event_index,
      )?.params;
      if (!params || params.length === 0) {
        throw new Error(
          `Parameters could not be retrieved for event with index: ${event_index}`,
        );
      }

      return {
        block,
        blockTimestampMs: block_timestamp * 1000,
        params,
        extrinsicHash: extrinsic_hash,
      };
    },
  );

  return { count, events: parsedEvents };
}

export interface ParsedEvent {
  block: number;
  blockTimestampMs: number;
  params: EventsParamsJSON['data'][number]['params'];
  extrinsicHash: string;
}

export async function* subScanEventGenerator(
  module: string,
  eventId: string,
  startBlock: number,
  transform: (events: ParsedEvent[]) => Promise<ParsedEvent[]>,
) {
  if (subscan.network === 'NONE') {
    return;
  }

  const api = ConfigService.get('api');

  const currentBlock = (await api.query.system.number()).toNumber();

  // get events in batches until the current block is reached
  for (
    let fromBlock = startBlock;
    fromBlock < currentBlock;
    fromBlock += BLOCK_RANGE_SIZE
  ) {
    // Subscan has a limit of 100 accessible pages for a given query.
    // To stay within the limit and don't miss any events, we reduce the block range when necessary.
    let rangeReducer = 1;
    const endOfBigLoopBlock = fromBlock + BLOCK_RANGE_SIZE;
    let nextFromBlock = fromBlock;

    while (nextFromBlock < endOfBigLoopBlock) {
      const parameters = {
        module,
        eventId,
        fromBlock: nextFromBlock,
        toBlock: nextFromBlock + Math.ceil(BLOCK_RANGE_SIZE / rangeReducer),
      };

      const { count } = await getEvents({ ...parameters, page: 0, row: 1 });

      const blockRange = `${parameters.fromBlock} - ${parameters.toBlock}`;

      if (count === 0) {
        logger.debug(
          `No new "${eventId}" events found on SubScan in block range ${blockRange}.`,
        );
        await sleep(QUERY_INTERVAL_MS);
        nextFromBlock = parameters.toBlock;
        continue;
      }

      logger.debug(
        `Found ${count} new "${eventId}" events on SubScan for in block range ${blockRange}.`,
      );

      const pages = Math.ceil(count / SUBSCAN_MAX_ROWS) - 1;

      if (pages > 100) {
        rangeReducer += 1;
        logger.debug(
          `Reducing block range to comply with Subscan's page limit.`,
        );
        continue;
      }

      for (let page = 0; page <= pages; page++) {
        const { events } = await getEvents({ ...parameters, page });
        if (!events) {
          continue;
        }

        logger.debug(
          `Loaded page ${page} of "${eventId}" events in block range ${blockRange}.`,
        );
        for (const event of await transform(events)) {
          yield event;
        }

        await sleep(QUERY_INTERVAL_MS);
      }

      nextFromBlock = parameters.toBlock;
      rangeReducer = 1;
    }
  }
}
