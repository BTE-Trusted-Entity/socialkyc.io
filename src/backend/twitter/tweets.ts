import { ApiResponseError, TwitterApi } from 'twitter-api-v2';
import * as Boom from '@hapi/boom';

import { configuration } from '../utilities/configuration';
import { ControlledPromise } from '../utilities/makeControlledPromise';
import { logger } from '../utilities/logger';
import { trackConnectionState } from '../utilities/trackConnectionState';
import { sleep } from '../utilities/sleep';

const screen_name = 'social_kyc_tech';

const requestsFrequencyMs = 60 * 1000;
const timeout = requestsFrequencyMs * 2;

export const twitterConnectionState = trackConnectionState(3 * 60 * 1000);

const client = new TwitterApi(configuration.twitterSecretBearerToken);

export async function getTwitterUserId(username: string) {
  try {
    const {
      data: { id },
    } = await client.v2.userByUsername(username);
    return id;
  } catch (error) {
    logger.debug(error);
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

async function getMentions(userId: string) {
  logger.trace('Getting Twitter mentions');
  try {
    const {
      data: { data: tweets },
    } = await client.v2.userMentionTimeline(userId, {
      expansions: ['author_id'],
      max_results: 5,
    });
    twitterConnectionState.on();
    return { tweets };
  } catch (error) {
    twitterConnectionState.off();
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

/** Map of Twitter user IDs to the codes, timestamps, and promises waiting for the tweet */
export const tweetsListeners: Map<
  string,
  { secret: string; confirmation: ControlledPromise<void>; created: Date }
> = new Map();

function allListenersHaveExpired() {
  for (const [id, { created }] of tweetsListeners.entries()) {
    const expiresOn = created.getTime() + timeout;
    if (expiresOn < Date.now()) {
      tweetsListeners.delete(id);
      logger.trace(`Twitter listener for ${id} has expired`);
    }
  }
  return tweetsListeners.size === 0;
}

async function onTweet(handleTweet: (text: string, userId: string) => void) {
  const myId = await getTwitterUserId(screen_name);

  while (true) {
    // wait before the request
    await sleep(requestsFrequencyMs);

    if (allListenersHaveExpired()) {
      logger.trace('Skipping Twitter check');
      continue;
    }

    try {
      const { tweets } = await getMentions(myId);
      for (const { text, author_id, id } of tweets) {
        try {
          handleTweet(text, author_id as string);
        } catch (error) {
          logger.error(error, 'Error handling tweet', id);
        }
      }
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
}

export async function listenForTweets(): Promise<void> {
  // do not await, it runs forever
  onTweet((text, userId) => {
    const userListeners = tweetsListeners.get(userId);
    if (!userListeners) {
      return;
    }
    const { secret, confirmation } = userListeners;
    if (text.includes(secret)) {
      logger.debug('Tweet includes the secret!');
      tweetsListeners.delete(userId);
      confirmation.resolve();
    } else {
      logger.trace(`Tweet does not include the secret: ${secret}`);
    }
  });
}
