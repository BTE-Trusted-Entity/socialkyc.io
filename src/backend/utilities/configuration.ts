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

const baseUri = env.URL;
if (!baseUri) {
  throw new Error('No base URI provided');
}

const did =
  env.DID || 'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY';
const backupPhrase =
  env.SECRET_BACKUP_PHRASE ||
  'receive clutch item involve chaos clutch furnace arrest claw isolate okay together';

if (!did || !backupPhrase) {
  throw new Error('No DID or no backup phrase provided');
}

export const configuration = {
  aws: {
    region,
    accessKeyId,
    secretAccessKey,
  },
  port: env.PORT || 3000,
  isProduction: env.NODE_ENV === 'production',
  baseUri,
  distFolder: path.join(cwd(), 'dist', 'frontend'),
  did,
  backupPhrase,
};
