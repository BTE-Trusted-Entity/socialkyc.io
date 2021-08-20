import { SendEmailCommand } from '@aws-sdk/client-ses';

import { sesClient } from './sesClient.js';

export async function sendEmail(recipientName, recipientAddress) {
  const params = {
    Destination: {
      ToAddresses: [recipientAddress],
    },
    Source: 'test@socialkyc.io',
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'SocialKYC - Confirm your email address',
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: `Hello ${recipientName},\n\nThis is a test email.\n\nKind regards,\nSocialKYC`,
        },
      },
    },
  };
  try {
    const data = await sesClient.send(new SendEmailCommand(params));
    console.log('Successfully sent email: ', data);
  } catch (err) {
    console.log('Error sending email: ', err.stack);
  }
}
