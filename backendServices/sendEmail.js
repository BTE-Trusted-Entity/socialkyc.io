import { SendEmailCommand } from '@aws-sdk/client-ses';

import { sesClient } from './sesClient.js';

export async function sendEmail(key, request) {
  const { contents } = request.claim;

  const email = contents['Email'];
  const name = contents['Full name'];

  const params = {
    Destination: {
      ToAddresses: [email],
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
          Data: `Hello ${name},\n\nThis is a test. Please click the link to confirm your email: ${process.env.URL}/confirmation?key=${key} \n\nKind regards,\nSocialKYC`,
        },
      },
    },
  };
  try {
    await sesClient.send(new SendEmailCommand(params));
  } catch (err) {
    console.log('Error sending email: ', err.stack);
  }
}
