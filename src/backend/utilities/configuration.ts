import { cwd } from 'node:process';
import path from 'node:path';

import dotenv from 'dotenv';

dotenv.config();

const { env } = process;

const region = env.AWS_REGION;
const accessKeyId = env.AWS_ACCESS_KEY_ID;
const secretAccessKey = env.AWS_SECRET_ACCESS_KEY;

if (!region || !accessKeyId || !secretAccessKey) {
  throw new Error('No AWS access values provided');
}

const twitterSecretBearerToken = env.TWITTER_SECRET_BEARER_TOKEN;
if (!twitterSecretBearerToken) {
  throw new Error('No Twitter token provided');
}

const baseUri = env.URL;
if (!baseUri) {
  throw new Error('No base URI provided');
}

const did = env.DID || 'pending';
const storeDidAndCTypes = env.STORE_DID_AND_CTYPES === 'true';
if (did === 'pending' && !storeDidAndCTypes) {
  throw new Error('Neither DID nor STORE_DID_AND_CTYPES provided');
}

const backupPhrase = env.SECRET_BACKUP_PHRASE;
if (!backupPhrase) {
  throw new Error('No backup phrase provided');
}

const blockchainEndpoint = env.BLOCKCHAIN_ENDPOINT;
if (!blockchainEndpoint) {
  throw new Error('No blockchain endpoint provided');
}

const httpAuthPassword = env.SECRET_HTTP_AUTH_PASSWORD;

const discord = {
  clientId: env.DISCORD_CLIENT_ID as string,
  clientSecret: env.DISCORD_CLIENT_SECRET,
};

if (!discord.clientId || !discord.clientSecret) {
  throw new Error('No discord client credentials provided');
}

const github = {
  clientId: env.GITHUB_CLIENT_ID as string,
  secret: env.SECRET_GITHUB,
};

if (!github.clientId || !github.secret) {
  throw new Error('No github client credentials provided');
}

const lowBalanceAlertRecipients = env.LOW_BALANCE_ALERT_RECIPIENTS;

if (!lowBalanceAlertRecipients) {
  throw new Error('No email recipients for low balance alerts');
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
  baseUri,
  distFolder: path.join(cwd(), 'dist', 'frontend'),
  did,
  backupPhrase,
  twitterSecretBearerToken,
  httpAuthPassword,
  storeDidAndCTypes,
  discord,
  github,
  lowBalanceAlertRecipients,
};
