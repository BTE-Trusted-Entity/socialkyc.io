import { ServerRoute, Request } from '@hapi/hapi';

import { z } from 'zod';

import { emailCType } from '../email/emailCType';

import { getSessionBySecret, setSession } from '../utilities/sessionStorage';
import { startAttestation } from '../utilities/attestClaim';

import { exceptionToError } from '../../frontend/utilities/exceptionToError';

import { getHtmlVariant } from '../utilities/htmlVariants';

import { paths } from './paths';

const zodParams = z.object({
  secret: z.string(),
});

type Params = z.infer<typeof zodParams>;

async function handler(request: Request): Promise<string> {
  const { logger } = request;

  const { secret } = request.params as Params;

  try {
    const session = getSessionBySecret(secret);
    const { requestForAttestation } = session;
    if (!requestForAttestation) {
      throw new Error('requestForAttestation not found');
    }
    if (requestForAttestation.claim.cTypeHash !== emailCType.hash) {
      throw new Error('requestForAttestation cType mismatch');
    }

    setSession({ ...session, confirmed: true });

    const attestationPromise = startAttestation(session, logger);
    attestationPromise.catch((error) => logger.error(error));

    logger.debug('Email attestation started');
  } catch (exception) {
    // no exceptions should be thrown since they will not be displayed nicely on the frontend

    const error = exceptionToError(exception);
    logger.error(error, 'Email confirmation error');
  } finally {
    return await getHtmlVariant('index.html');
  }
}

export const confirmationHtml: ServerRoute = {
  method: 'GET',
  path: paths.email.confirmationHtml,
  handler,
};
