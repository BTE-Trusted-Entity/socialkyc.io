import type { HexString } from '@kiltprotocol/types';

import got from 'got';

import { ConfigService } from '@kiltprotocol/sdk-js';

import { configuration } from '../utilities/configuration';
import { logger } from '../utilities/logger';
import { sleep } from '../utilities/sleep';

const { subscan } = configuration;

const SUBSCAN_MAX_ROWS = 100;
const QUERY_INTERVAL_MS = 1000;
const BLOCK_RANGE_SIZE = 100_000;

const eventsApi = `https://${subscan.network}.api.subscan.io/api/scan/events`;
const headers = {
  'X-API-Key': subscan.secret,
};

export interface EventsResponseJson {
  data: {
    count: number;
    events: Array<{
      params: string;
      block_num: number;
      block_timestamp: number;
      extrinsic_hash: HexString;
    }> | null;
  };
}

export async function getEvents({
  fromBlock,
  row = SUBSCAN_MAX_ROWS,
  ...parameters
}: {
  module: string;
  call: string;
  fromBlock: number;
  page: number;
  row?: number;
}) {
  const json = {
    ...parameters,
    block_range: `${fromBlock}-${fromBlock + BLOCK_RANGE_SIZE}`,
    row,
    finalized: true,
  };

  const {
    data: { count, events },
  } = await got.post(eventsApi, { headers, json }).json<EventsResponseJson>();

  if (!events) {
    return { count };
  }

  events.reverse();
  const parsedEvents = events.map(
    ({ block_num, block_timestamp, extrinsic_hash, params }) => ({
      block: block_num,
      blockTimestampMs: block_timestamp * 1000,
      params: JSON.parse(params),
      extrinsicHash: extrinsic_hash,
    }),
  );

  return { count, events: parsedEvents };
}

type ParsedEvents = Required<Awaited<ReturnType<typeof getEvents>>>['events'];

export async function* subScanEventGenerator(
  module: string,
  call: string,
  startBlock: number,
  transform: (events: ParsedEvents) => Promise<ParsedEvents>,
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
    const parameters = {
      module,
      call,
      fromBlock,
    };

    const { count } = await getEvents({ ...parameters, page: 0, row: 1 });

    const blockRange = `${fromBlock} - ${fromBlock + BLOCK_RANGE_SIZE}`;

    if (count === 0) {
      logger.debug(
        `No new SubScan events found for ${call} in block range ${blockRange}`,
      );
      await sleep(QUERY_INTERVAL_MS);
      continue;
    }

    logger.debug(
      `Found ${count} new SubScan events for ${call} in block range ${blockRange}`,
    );

    const pages = Math.ceil(count / SUBSCAN_MAX_ROWS) - 1;

    for (let page = pages; page >= 0; page--) {
      const { events } = await getEvents({ ...parameters, page });
      if (!events) {
        continue;
      }

      logger.debug(
        `Loaded events page ${page} for ${call} in block range ${blockRange}`,
      );
      for (const event of await transform(events)) {
        yield event;
      }

      await sleep(QUERY_INTERVAL_MS);
    }
  }
}
