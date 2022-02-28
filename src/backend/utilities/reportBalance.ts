import { IIdentity } from '@kiltprotocol/types';
import { Balance, BalanceUtils } from '@kiltprotocol/core';

import { BN } from '@polkadot/util';

import { SendEmailCommand } from '@aws-sdk/client-ses';

import { sesClient } from '../email/sesClient';

import { logger } from './logger';
import { configuration } from './configuration';

const REPORT_THRESHOLD = new BN('10000000000000000000');
const REPORT_FREQUENCY = 24 * 60 * 60 * 1000;

async function sendLowBalanceAlert(balance: string) {
  const Data = `The SocialKYC balance is currently low. Please add more KILT coins.
  
Current balance: ${balance}
  
This is an automatically generated email.`;

  const { lowBalanceAlertRecipients } = configuration;

  const command = new SendEmailCommand({
    Destination: {
      ToAddresses: lowBalanceAlertRecipients.split(','),
    },
    Source: '"SocialKYC" <attester@socialkyc.io>',
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'SocialKYC – Low Balance Alert',
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data,
        },
      },
    },
  });

  await sesClient.send(command);
}

function sleep(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

export async function reportBalance(
  address: IIdentity['address'],
): Promise<void> {
  while (true) {
    const balances = await Balance.getBalances(address);

    const free = BalanceUtils.formatKiltBalance(balances.free);
    const reserved = BalanceUtils.formatKiltBalance(balances.reserved);

    logger.info(`Free: ${free}, bonded: ${reserved}`);

    if (balances.free.lt(REPORT_THRESHOLD)) {
      await sendLowBalanceAlert(free);
    }

    await sleep(REPORT_FREQUENCY);
  }
}
