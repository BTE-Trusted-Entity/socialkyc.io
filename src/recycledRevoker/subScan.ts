import got from "got";

import { configuration } from "./configuration";
import { logger } from "./logger";
import { sleep } from "./sleep";

const { subscan } = configuration;

const SUBSCAN_MAX_ROWS = 100;
const QUERY_INTERVAL_MS = 1000;

const eventsApi = `https://${subscan.network}.api.subscan.io/api/scan/events`;

const headers = {
  "X-API-Key": subscan.secret,
};

export interface EventsResponseJson {
  data: {
    count: number;
    events: Array<{
      params: string;
      block_num: number;
      block_timestamp: number;
      extrinsic_hash: `0x${string}`;
    }> | null;
  };
}

export async function getEvents({
  fromBlock: from_block,
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
    from_block,
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
    })
  );

  return { count, events: parsedEvents };
}

export async function* subScanEventGenerator(
  module: string,
  call: string,
  fromBlock: number
) {
  const parameters = {
    module,
    call,
    fromBlock,
  };
  const { count } = await getEvents({ ...parameters, page: 0, row: 1 });

  if (count === 0) {
    logger.debug(`No new SubScan events found for ${call}`);
    return;
  }

  logger.debug(
    `Found ${count} (really ${count - 1}?) new SubScan events for ${call}`
  );

  // 10001 items should be split into 101 pages (0 to 100 inclusive)
  // of 100 items each except the last one with 1 item,
  // but SubScan seems to have a bug and returns page 100 without items.
  const remainder = count % SUBSCAN_MAX_ROWS;
  const ignoreLastPage = count > SUBSCAN_MAX_ROWS && remainder === 1;
  const ignoredPages = ignoreLastPage ? 1 : 0;
  const pages = Math.ceil(count / SUBSCAN_MAX_ROWS) - 1;

  for (let page = pages - ignoredPages; page >= 0; page--) {
    const { events } = await getEvents({ ...parameters, page });
    if (!events) {
      throw new Error("No events");
    }

    logger.debug(`Loaded events page ${page} for ${call}`);
    for (const event of events) {
      yield event;
    }

    await sleep(QUERY_INTERVAL_MS);
  }
}
