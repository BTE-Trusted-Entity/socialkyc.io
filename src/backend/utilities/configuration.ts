import { cwd } from 'node:process';
import path from 'node:path';

import { config } from 'dotenv';
import { pino } from 'pino';
import { DidUri } from '@kiltprotocol/sdk-js';

config();

class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    pino().fatal(message);
    process.exit(1);
  }
}

const { env } = process;

const region = env.AWS_REGION;
const accessKeyId = env.AWS_ACCESS_KEY_ID;
const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
  throw new ConfigurationError('No AWS access values provided');
}

const twitterSecretBearerToken = env.TWITTER_SECRET_BEARER_TOKEN;
if (!twitterSecretBearerToken) {
  throw new ConfigurationError('No Twitter token provided');
}

const baseUri = env.URL;
if (!baseUri) {
  throw new ConfigurationError('No base URI provided');
}

const did = (env.DID || 'pending') as DidUri | 'pending';
const storeDidAndCTypes = env.STORE_DID_AND_CTYPES === 'true';
if (did === 'pending' && !storeDidAndCTypes) {
  throw new ConfigurationError('Neither DID nor STORE_DID_AND_CTYPES provided');
}

const maintenanceMode = env.MAINTENANCE === 'true';

const backupPhrase = env.SECRET_BACKUP_PHRASE;
if (!backupPhrase) {
  throw new ConfigurationError('No backup phrase provided');
}

const blockchainEndpoint = env.BLOCKCHAIN_ENDPOINT;
if (!blockchainEndpoint) {
  throw new ConfigurationError('No blockchain endpoint provided');
}

const httpAuthPassword = env.SECRET_HTTP_AUTH_PASSWORD;

const discord = {
  clientId: env.DISCORD_CLIENT_ID as string,
  clientSecret: env.DISCORD_CLIENT_SECRET,
};

if (!discord.clientId || !discord.clientSecret) {
  throw new ConfigurationError('No discord client credentials provided');
}

const github = {
  clientId: env.GITHUB_CLIENT_ID as string,
  secret: env.SECRET_GITHUB,
};

if (!github.clientId || !github.secret) {
  throw new ConfigurationError('No github client credentials provided');
}

const twitch = {
  clientId: env.CLIENT_ID_TWITCH as string,
  secret: env.SECRET_TWITCH,
};

if (!twitch.clientId || !twitch.secret) {
  throw new ConfigurationError('No Twitch client credentials provided');
}

const telegram = {
  token: env.SECRET_TELEGRAM as string,
};

if (!telegram.token) {
  throw new ConfigurationError('No Telegram token provided');
}

const youtube = {
  clientId: env.YOUTUBE_CLIENT_ID as string,
  clientSecret: env.SECRET_YOUTUBE_CLIENT,
};

if (!youtube.clientId || !youtube.clientSecret) {
  throw new ConfigurationError('No youtube client credentials provided');
}

const lowBalanceAlertRecipients = env.LOW_BALANCE_ALERT_RECIPIENTS;

if (!lowBalanceAlertRecipients) {
  throw new ConfigurationError('No email recipients for low balance alerts');
}

const subscan = {
  network: env.SUBSCAN_NETWORK,
  secret: env.SECRET_SUBSCAN,
};
if (!subscan.secret) {
  throw new ConfigurationError('No SubScan secret provided');
}
if (!subscan.network) {
  throw new ConfigurationError('No SubScan network provided');
}

const indexer = {
  graphqlEndpoint: env.GRAPHQL_ENDPOINT as string,
};
if (!indexer.graphqlEndpoint) {
  throw new ConfigurationError('No endpoint for the GraphQL server provided');
}

export const configuration = {
  aws: {
    region,
    accessKeyId,
    secretAccessKey,
  },
  port: env.PORT || 3000,
  blockchainEndpoint,
  isProduction: env.NODE_ENV === 'production',
  isTestEnvironment: env.IS_TEST_ENV === 'true',
  maintenanceMode,
  baseUri,
  distFolder: path.join(cwd(), 'dist', 'frontend'),
  did,
  backupPhrase,
  twitterSecretBearerToken,
  httpAuthPassword,
  storeDidAndCTypes,
  discord,
  github,
  twitch,
  telegram,
  youtube,
  lowBalanceAlertRecipients,
  subscan,
  indexer,
};
