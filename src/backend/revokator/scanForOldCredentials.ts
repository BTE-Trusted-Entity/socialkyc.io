import type { AccountId32 } from '@polkadot/types/interfaces';

import got from 'got';

import { Did, DidUri } from '@kiltprotocol/sdk-js';

import { configuration, setupSubscanApi } from '../utilities/configuration';

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

export interface ParametersEntry {
  type: string;
  type_name: string;
  value: AccountId32 | null;
}

scanForOldCredentials(0, 100000, true);

/**
 * Get the extrinsic-hashes of the attestations that should be revoked.
 *
 * Using `got` to get the info from subscan. Using the subscan API, and a Key identifying us.
 *
 * The maximum block-range is 500.000 Blocks.
 * 100.000 blocks is ruffly equivalent to 14 days
 * @param fromBlock
 * @param toBlock
 * @param verbose: boolean to print all the steps
 * @returns extrinsic hashes as an array.
 */
export async function scanForOldCredentials(
  fromBlock: number,
  toBlock: number,
  verbose: boolean = false,
): Promise<string[]> {
  // Each http query is limited by the page size.
  // So we have to do a loop until all pages are empty, to be sure we got all attestations within a block range.
  let pageIndex: number = 0;
  const attestationHashes: string[] = [];
  let isPageEmpty: boolean = false;

  while (!isPageEmpty) {
    const attestationHashesWithinAPage = await scanForOldCredentialsOnOnePage(
      fromBlock,
      toBlock,
      pageIndex,
      verbose,
    );
    for (const i in attestationHashesWithinAPage) {
      attestationHashes.push(attestationHashesWithinAPage[i]);
    }
    pageIndex++;
    if (attestationHashesWithinAPage.length === 0) {
      isPageEmpty = true;
    }
  }
  verbose &&
    console.log(
      'Final Array of Extrinsic Hashes for Attestations within the given block range',
      attestationHashes,
      'Total Number of attestations found : ',
      attestationHashes.length,
    );
  return attestationHashes;
}

async function scanForOldCredentialsOnOnePage(
  fromBlock: number,
  toBlock: number,
  page: number,
  verbose = false,
): Promise<string[]> {
  const chainFlag = configuration.isTestEnvironment ? 'p' : 's';
  const subscan = setupSubscanApi(chainFlag);
  const subscanApiUrl = subscan.apiUrl;
  const eventsURL = `${subscanApiUrl}/api/scan/events`;

  const headerWithKey = {
    'X-API-Key': subscan.xApiKey,
  };

  const payloadForInfoRequest = packPayloadForRequest(fromBlock, toBlock, page);

  verbose &&
    console.log('payload send on the request: ', payloadForInfoRequest);

  const subscanResponse = await got
    .post(eventsURL, {
      headers: headerWithKey,
      json: payloadForInfoRequest,
    })
    .json<EventsResponseJson>();

  const isEmpty = checkIfEmpty(subscanResponse, page, verbose);
  if (isEmpty) {
    return [];
  }

  const eventsAttestedBySocialKYC = filterByAttester(
    subscanResponse,
    subscan.socialKYCDidUri,
  );

  const extrinsicHashesOfAttestations = eventsAttestedBySocialKYC.map(
    (event) => {
      return event.extrinsic_hash;
    },
  );

  return extrinsicHashesOfAttestations;
}

// Resources:

/**
 * Makes the required Body Payload for the events request
 * The maximum block-range is 500.000 Blocks.
 * 100.000 blocks is ruffly equivalent to 14 days
 *  days =  (100000*12s)/(60*60*24)
 *  */
function packPayloadForRequest(
  fromBlock: number,
  toBlock: number,
  page: number,
) {
  const bodyPayload = {
    row: 100,
    page: 0,
    block_range: '0-100000',
    module: 'attestation',
    call: 'AttestationCreated',
    finalized: true,
  };

  const newBlockRange = `${fromBlock}-${toBlock}`;

  bodyPayload.block_range = newBlockRange;
  bodyPayload.page = page;

  return bodyPayload;
}

/** Checks if the response is empty.
 * Also prints each event, if verbose is set to true.
 */
function checkIfEmpty(
  eventsResponse: EventsResponseJson,
  page: number,
  verbose: boolean = false,
): boolean {
  const dataObject = eventsResponse.data;
  verbose && console.log('Response Data of the Subscan events query:');
  verbose &&
    console.log(
      'Count of extrinsics: ',
      dataObject.count,
      ' Page being queried',
      page,
    );

  if (!dataObject.events) {
    // makes output orange
    console.log('\u001B[38;5;214m');
    page === 0 && console.log('No events for this request found.');
    // reset output's appearance:
    console.log('\u001b[0m');

    return true;
  }
  verbose && console.log('Events: ', dataObject.events);
  return false;
}

function filterByAttester(
  subscanResponse: EventsResponseJson,
  wishedDID: DidUri,
) {
  const events = subscanResponse?.data.events;
  if (!events) {
    throw new Error('No events found. ');
  }

  const interestingEvents = events.filter((event) => {
    const paramsObject = JSON.parse(event.params);
    const parametersArray: ParametersEntry[] = [...paramsObject];
    const relevantParameter = parametersArray.find((element) => {
      return element.type_name === 'AttesterOf';
    });
    const attesterDidAsHex = relevantParameter?.value;

    if (!attesterDidAsHex) {
      return false;
    }

    const didOfAttester = Did.fromChain(attesterDidAsHex);

    return didOfAttester === wishedDID;
  });

  return interestingEvents;
}
