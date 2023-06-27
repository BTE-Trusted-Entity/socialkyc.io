import { ApiResponseError, TwitterApi } from 'twitter-api-v2';
import * as Boom from '@hapi/boom';

import { configuration } from '../utilities/configuration';
import { ControlledPromise } from '../utilities/makeControlledPromise';
import { logger } from '../utilities/logger';
import { trackConnectionState } from '../utilities/trackConnectionState';
import { sleep } from '../utilities/sleep';

const screen_name = 'social_kyc_tech';
const mention = '@social_kyc_tech';

const requestsFrequencyMs = 60 * 1000;
const maxRequests = 2;

export const twitterConnectionState = trackConnectionState(3 * 60 * 1000);

const client = new TwitterApi(configuration.twitterSecretBearerToken);

export async function getTwitterUserId(username: string) {
  try {
    const {
      data: { id },
    } = await client.v2.userByUsername(username);
    return id;
  } catch {
    throw Boom.notFound('Twitter username not found');
  }
}

export async function canAccessTwitter() {
  try {
    await getTwitterUserId(screen_name);
    twitterConnectionState.on();
  } catch (error) {
    twitterConnectionState.off();
    logger.error(error, 'Error connecting to Twitter');
    throw error;
  }
}

async function getLatestUserTweets(userId: string) {
  try {
    const {
      data: { data: tweets },
    } = await client.v2.userTimeline(userId, { max_results: 5 });
    return tweets;
  } catch (error) {
    throw error;
  }
}

async function rateLimitToBeReset(error: ApiResponseError) {
  if (!error.rateLimit) {
    return;
  }

  const resetTimeoutMs = error.rateLimit.reset * 1000;
  const timeToWaitMs = resetTimeoutMs - Date.now();

  logger.warn(error, `Hit a rate limit, waiting for ${timeToWaitMs} ms`);

  await sleep(timeToWaitMs);
}

/** Map of Twitter user IDs to the codes and promises waiting for the tweet */
export const tweetsListeners: Map<string, [string, ControlledPromise<void>]> =
  new Map();

export async function listenForUserTweets(userId: string): Promise<void> {
  let requests = 0;

  const userListeners = tweetsListeners.get(userId);
  if (!userListeners) {
    return;
  }
  const [secret, { resolve }] = userListeners;

  while (requests < maxRequests) {
    // wait before the next request
    await sleep(requestsFrequencyMs);

    try {
      const tweets = await getLatestUserTweets(userId);
      for (const { text } of tweets) {
        if (!text.includes(mention)) {
          logger.trace(`Tweet does not mention ${mention}`);
          continue;
        }
        if (!text.includes(secret)) {
          logger.trace(`Tweet does not include the secret: ${secret}`);
          continue;
        }
        logger.debug('Tweet includes the secret!');
        resolve();
        return;
      }

      requests++;
    } catch (error) {
      if (error instanceof ApiResponseError && error.rateLimitError) {
        try {
          await rateLimitToBeReset(error);
        } catch (rateError) {
          logger.error(rateError, 'Error processing the rate limit');
        }
        continue;
      }

      logger.error(error, 'Unexpected TwitterAPI error');
    }
  }

  logger.trace('Tweet not found');
}
