import { SendEmailCommand } from '@aws-sdk/client-ses';
import rateLimit from 'express-rate-limit';
import { NextFunction, Request, Response } from 'express';
import { IRequestForAttestation } from '@kiltprotocol/types';
import { RequestForAttestation } from '@kiltprotocol/core';

import { configuration } from '../utilities/configuration';
import { cacheRequestForAttestation } from '../utilities/requestCache';
import { sesClient } from '../utilities/sesClient';

const requestLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: 'Too many requests, please try again in an hour.',
});

export async function send(
  url: string,
  requestForAttestation: IRequestForAttestation,
): Promise<void> {
  const { contents } = requestForAttestation.claim;

  const email = contents['Email'] as string;
  const name = contents['Full name'] as string;

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
          Data: `Hello ${name},\n\nThis is a test. Please click the link to confirm your email: ${url} \n\nKind regards,\nSocialKYC`,
        },
      },
    },
  };
  await sesClient.send(new SendEmailCommand(params));
}

export async function sendEmail(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    if (!RequestForAttestation.isIRequestForAttestation(req.body)) {
      throw new Error('Invalid request for attestation');
    }

    const requestForAttestation = req.body;

    const key = requestForAttestation.rootHash;
    cacheRequestForAttestation(key, requestForAttestation);

    const url = `${configuration.baseUri}/confirmation/${key}`;

    await send(url, requestForAttestation);
    res.sendStatus(200);
  } catch (error) {
    next(error);
  }
}

export const request = [requestLimiter, sendEmail];
