import { Request, ServerRoute } from '@hapi/hapi';

import { z } from 'zod';

import { getSessionBySecret, setSession } from '../utilities/sessionStorage';
import { startAttestation } from '../utilities/attestClaim';

import { exceptionToError } from '../../frontend/utilities/exceptionToError';

import { getHtmlVariant } from '../utilities/htmlVariants';

import { paths } from '../endpoints/paths';

import { emailCType } from './emailCType';

const zodParams = z.object({
  state: z.string(),
});

async function handler(request: Request): Promise<string> {
  const { logger } = request;

  try {
    const secret = zodParams.parse(request.query).state;

    const session = getSessionBySecret(secret);
    const { requestForAttestation } = session;
    if (!requestForAttestation) {
      throw new Error('requestForAttestation not found');
    }
    if (requestForAttestation.claim.cTypeHash !== emailCType.hash) {
      throw new Error('requestForAttestation cType mismatch');
    }

    const confirmedSession = { ...session, confirmed: true };
    setSession(confirmedSession);

    const attestationPromise = startAttestation(confirmedSession, logger);
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

export const authHtmlEmail: ServerRoute = {
  method: 'GET',
  path: paths.redirect.email,
  handler,
};
