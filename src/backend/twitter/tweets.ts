import { ApiResponseError, TwitterApi } from 'twitter-api-v2';

import { find } from 'lodash-es';

import { configuration } from '../utilities/configuration';
import { ControlledPromise } from '../utilities/makeControlledPromise';
import { logger } from '../utilities/logger';
import { trackConnectionState } from '../utilities/trackConnectionState';
import { sleep } from '../utilities/sleep';

const screen_name = 'social_kyc_tech';
const query = '@social_kyc_tech';

const requestsFrequencyMs = 15 * 1000;

export const twitterConnectionState = trackConnectionState(3 * 60 * 1000);

const client = new TwitterApi(configuration.twitterSecretBearerToken);

export async function canAccessTwitter() {
  try {
    await client.v2.userByUsername(screen_name);
    twitterConnectionState.on();
  } catch (error) {
    twitterConnectionState.off();
    logger.error(error, 'Error connecting to Twitter');
    throw error;
  }
}

async function getTweets() {
  try {
    const {
      data: { data: tweets, includes },
    } = await client.v2.search({
      query,
      expansions: ['author_id'],
      'tweet.fields': ['author_id', 'text'],
      'user.fields': ['id', 'username'],
    });
    twitterConnectionState.on();
    return { tweets, includes };
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

async function onTweet(handleTweet: (text: string, username: string) => void) {
  while (true) {
    try {
      const { tweets, includes } = await getTweets();
      for (const { text, author_id, id } of tweets) {
        try {
          const author = find(includes?.users, { id: author_id });
          if (!author) {
            throw new Error('Cannot find author for tweet');
          }
          handleTweet(text, author.username);
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

    // wait before the next request
    await sleep(requestsFrequencyMs);
  }
}

/** Map of Twitter usernames to the codes and promises waiting for the tweet */
export const tweetsListeners: Map<string, [string, ControlledPromise<void>]> =
  new Map();

export async function listenForTweets(): Promise<void> {
  // do not await, it runs forever
  onTweet((text, username) => {
    const userListeners = tweetsListeners.get(username.toLowerCase());
    if (!userListeners) {
      return;
    }
    const [secret, { resolve }] = userListeners;
    if (text.includes(secret)) {
      logger.debug('Tweet includes the secret!');
      resolve();
    } else {
      logger.trace(`Tweet does not include the secret: ${secret}`);
    }
  });
}
