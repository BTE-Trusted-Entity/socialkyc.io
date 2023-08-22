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
};

export function setupSubscanApi(chain?: 'p' | 's') {
  // This is the subscan key for the andres@kilt.io account:
  const xApiKey = 'fd1db8265bd444aba743ad07dd8b7dad';

  const peregrineNetwork = 'kilt-testnet';
  const spiritnetNetwork = 'spiritnet';

  const socialKYCPeregrineAddress =
    '4sQR3dfZrrxobV69jQmLvArxyUto5eJtmyc2f9xs1Hc4quu3';

  const socialKYCSpiritnetAddress =
    '4qEmG7bexsWtG1LiPFj95GL38xGcNfBz83LYeErixgHB47PW';

  const socialKYCPeregrineDidUri: DidUri =
    'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY';

  const socialKYCSpiritnetDidUri: DidUri =
    'did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare';

  // for chain = "p" or undefined
  let network = peregrineNetwork;
  if (chain === 's') {
    network = spiritnetNetwork;
  }

  const apiUrl = `https://${network}.api.subscan.io`;

  const subscan = {
    apiUrl,
    network,
    xApiKey,
    headers: { 'X-API-Key': xApiKey },
    isCrawlingFrom:
      network === spiritnetNetwork ? 'Kilt Spiritnet' : 'Kilt Peregrine',
    socialKYCAddress:
      network === spiritnetNetwork
        ? socialKYCSpiritnetAddress
        : socialKYCPeregrineAddress,
    socialKYCDidUri:
      network === spiritnetNetwork
        ? socialKYCSpiritnetDidUri
        : socialKYCPeregrineDidUri,
  };

  return subscan;
}
