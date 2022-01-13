import {
  ServerRoute,
  ResponseToolkit,
  Request,
  ResponseObject,
} from '@hapi/hapi';

import { z } from 'zod';

import { emailCType } from '../email/emailCType';

import { configuration } from '../utilities/configuration';
import { getSessionBySecret, setSession } from '../utilities/sessionStorage';
import { getAttestationMessage } from '../utilities/attestClaim';

import { exceptionToError } from '../../frontend/utilities/exceptionToError';

import { paths } from './paths';

const zodParams = z.object({
  secret: z.string(),
});

type Params = z.infer<typeof zodParams>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
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

    getAttestationMessage(session);
    logger.debug('Attestation started');
  } catch (exception) {
    // no exceptions should be thrown since they will not be displayed nicely on the frontend

    const error = exceptionToError(exception);
    logger.error(`Email confirmation error: ${error}`);
  } finally {
    return h.file('index.html');
  }
}

export const confirmationHtml: ServerRoute = {
  method: 'GET',
  path: paths.confirmationHtml,
  handler,
  options: {
    files: {
      relativeTo: configuration.distFolder,
    },
  },
};
