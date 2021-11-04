import { TwitterApi, TweetV1, ApiResponseError } from 'twitter-api-v2';

import { configuration } from './configuration';
import { ControlledPromise } from './makeControlledPromise';
import { logger } from './logger';

const screen_name = 'social_kyc_tech';
const hashTag = '#socialkyc';

const requestsFrequencyMs = 10 * 1000;

const client = new TwitterApi(configuration.twitterSecretBearerToken);

async function getTweets() {
  const { statuses } = await client.v1.get('search/tweets.json', {
    q: hashTag,
    result_type: 'recent',
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
          logger.error(`Error handling tweet: ${error}`, tweet);
        }
      }
    } catch (error) {
      if (error instanceof ApiResponseError && error.rateLimitError) {
        try {
          await rateLimitToBeReset(error);
        } catch (rateError) {
          logger.error(`Error processing the rate limit: ${rateError}`);
        }
        continue;
      }

      logger.error(`Unexpected TwitterAPI error: ${error}`);
    }

    // wait before the next request
    await sleep(requestsFrequencyMs);
  }
}

/** Map of Twitter usernames to the codes and promises waiting for the tweet */
export const tweetsListeners: Record<
  string,
  [string, ControlledPromise<void>]
> = {};

export async function listenForTweets(): Promise<void> {
  // ensure we’re authorized to access Twitter API
  await client.v1.user({ screen_name });

  // do not await, it runs forever
  onTweet(({ user: { name }, text }) => {
    if (!(name in tweetsListeners)) {
      return;
    }
    const [code, { resolve }] = tweetsListeners[name];
    if (text.includes(code)) {
      resolve();
    }
  });
}
