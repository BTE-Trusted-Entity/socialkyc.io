import { ApiResponseError, TweetV1, TwitterApi } from 'twitter-api-v2';

import { configuration } from '../utilities/configuration';
import { ControlledPromise } from '../utilities/makeControlledPromise';
import { logger } from '../utilities/logger';
import { trackConnectionState } from '../utilities/trackConnectionState';
import { sleep } from '../utilities/sleep';

const screen_name = 'social_kyc_tech';
const searchQuery = '@social_kyc_tech';

const requestsFrequencyMs = 10 * 1000;

export const twitterConnectionState = trackConnectionState(3 * 60 * 1000);

const client = new TwitterApi(configuration.twitterSecretBearerToken);

export async function canAccessTwitter() {
  try {
    await client.v1.user({ screen_name });
    twitterConnectionState.on();
  } catch (error) {
    twitterConnectionState.off();
    logger.error(error, 'Error connecting to Twitter');
    throw error;
  }
}

async function getTweets() {
  try {
    const { statuses } = await client.v1.get('search/tweets.json', {
      q: searchQuery,
      result_type: 'recent',
      tweet_mode: 'extended',
    });
    twitterConnectionState.on();
    return statuses as TweetV1[];
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

async function onTweet(handleTweet: (tweet: TweetV1) => void) {
  while (true) {
    try {
      const tweets = await getTweets();
      for (const tweet of tweets) {
        try {
          handleTweet(tweet);
        } catch (error) {
          logger.error(error, 'Error handling tweet', tweet.id);
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
  onTweet(({ user: { screen_name }, full_text }) => {
    const userListeners = tweetsListeners.get(screen_name.toLowerCase());
    if (!userListeners) {
      return;
    }
    const [secret, { resolve }] = userListeners;
    if (full_text?.includes(secret)) {
      logger.debug('Tweet includes the secret!');
      resolve();
    } else {
      logger.trace(`Tweet does not include the secret: ${secret}`);
    }
  });
}
