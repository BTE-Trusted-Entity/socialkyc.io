import { TwitterApi, TweetV1, ApiResponseError } from 'twitter-api-v2';

import { configuration } from '../utilities/configuration';
import { ControlledPromise } from '../utilities/makeControlledPromise';
import { logger } from '../utilities/logger';

const screen_name = 'social_kyc_tech';
const hashTag = '#socialkyc';

const requestsFrequencyMs = 10 * 1000;

const client = new TwitterApi(configuration.twitterSecretBearerToken);

async function getTweets() {
  const { statuses } = await client.v1.get('search/tweets.json', {
    q: hashTag,
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
  onTweet(({ user: { name }, full_text }) => {
    if (!(name in tweetsListeners)) {
      return;
    }
    const [secret, { resolve }] = tweetsListeners[name];
    if (full_text?.includes(secret)) {
      logger.debug('Tweet includes the secret!');
      resolve();
    } else {
      logger.debug(`Tweet does not include the secret: ${secret}`);
    }
  });
}
