import Twitter from 'twitter-v2';
import { keyBy, castArray } from 'lodash';

import { configuration } from './configuration';
import { ControlledPromise } from './makeControlledPromise';
import { logger } from './logger';

const client = new Twitter({
  bearer_token: configuration.twitterSecretBearerToken,
});

function createStream() {
  return client.stream('tweets/search/stream', { expansions: 'author_id' });
}

interface Tweet {
  author_id: string;
  text: string;
}

interface User {
  id: string;
  username: string;
}

interface Chunk {
  data: Tweet | Tweet[];
  includes: {
    users: User[];
  };
}

interface MappedTweet {
  text: string;
  username: string;
}

const reconnectTimeoutMs = 3000;

export async function createRules(): Promise<void> {
  await client.post('tweets/search/stream/rules', {
    add: [{ value: '#socialkyc', tag: 'tweets with hashtag' }],
  });
}

async function onChunk(handleChunk: (chunk: Chunk) => void) {
  while (true) {
    try {
      for await (const chunk of createStream()) {
        handleChunk(chunk);
      }
      // The stream has been closed by Twitter. It is usually safe to reconnect.
      logger.info('Stream disconnected healthily. Reconnecting.');
    } catch (error) {
      // An error occurred so we reconnect to the stream.
      logger.error(error, 'Stream disconnected with error. Retrying.');
    }

    // wait before reconnecting
    await new Promise((resolve) => setTimeout(resolve, reconnectTimeoutMs));
  }
}

async function onTweet(handleTweet: (tweet: MappedTweet) => void) {
  await onChunk((chunk) => {
    try {
      const usersMap = keyBy(chunk.includes.users, 'id');
      for (const { text, author_id } of castArray(chunk.data)) {
        const { username } = usersMap[author_id];
        handleTweet({ text, username });
      }
    } catch (error) {
      logger.error(error, 'Error handling chunk');
    }
  });
}

/** Map of Twitter usernames to the codes and promises waiting for the tweet */
export const tweetsListeners: Record<
  string,
  [string, ControlledPromise<void>]
> = {};

export async function listenForTweets(): Promise<void> {
  await createRules();

  // do not await, it runs forever
  onTweet(({ username, text }) => {
    if (!(username in tweetsListeners)) {
      return;
    }
    const [code, { resolve }] = tweetsListeners[username];
    if (text.includes(code)) {
      resolve();
    }
  });
}
