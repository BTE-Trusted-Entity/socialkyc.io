import { TwitterApi, TweetV1, ApiResponseError } from 'twitter-api-v2';

import { configuration } from '../utilities/configuration';
import { ControlledPromise } from '../utilities/makeControlledPromise';
import { logger } from '../utilities/logger';

const screen_name = 'social_kyc_tech';
const searchQuery = '@social_kyc_tech';

const requestsFrequencyMs = 10 * 1000;

const client = new TwitterApi(configuration.twitterSecretBearerToken);

async function getTweets() {
  const { statuses } = await client.v1.get('search/tweets.json', {
    q: searchQuery,
    result_type: 'recent',
    tweet_mode: 'extended',
  });
  return statuses as TweetV1[];
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
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
          logger.error(error, 'Error handling tweet', tweet);
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
  // ensure we’re authorized to access Twitter API
  await client.v1.user({ screen_name });

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
