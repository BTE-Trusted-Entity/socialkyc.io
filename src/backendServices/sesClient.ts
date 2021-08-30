import dotenv from 'dotenv';
import { SESClient } from '@aws-sdk/client-ses';

dotenv.config();

const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

if (!accessKeyId || !secretAccessKey) {
  throw new Error('No AWS access values provided');
}

export const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: { accessKeyId, secretAccessKey },
});
