import { SendEmailCommand } from '@aws-sdk/client-ses';

import { exceptionToError } from '../../frontend/utilities/exceptionToError';
import { trackConnectionState } from '../utilities/trackConnectionState';
import { sleep } from '../utilities/sleep';
import { logger } from '../utilities/logger';

import { sesClient } from './sesClient';

export const sesConnectionState = trackConnectionState(20 * 60 * 1000);

const Charset = 'UTF-8';

export async function canAccessAmazonSES() {
  const sendEmailCommand = new SendEmailCommand({
    Destination: {
      ToAddresses: [''],
    },
    Source: '"SocialKYC" <attester@socialkyc.io>',
    Message: {
      Subject: { Charset, Data: 'SocialKYC test' },
      Body: { Text: { Charset, Data: 'Test' } },
    },
  });

  try {
    await sesClient.send(sendEmailCommand);
  } catch (exception) {
    const error = exceptionToError(exception);
    if (error.name !== 'InvalidParameterValue') {
      sesConnectionState.off();
      logger.error(error, 'Error connecting to AWS SES');
      throw error;
    }
    sesConnectionState.on();
  }
}

export async function noAwaitCheckSesConnection() {
  while (true) {
    await sleep(10 * 60 * 1000);
    try {
      await canAccessAmazonSES();
    } catch {}
  }
}
