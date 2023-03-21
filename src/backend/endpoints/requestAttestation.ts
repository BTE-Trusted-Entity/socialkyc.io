import type {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import type { SupportedCType } from '../utilities/supportedCType';

import { StatusCodes } from 'http-status-codes';
import { Credential } from '@kiltprotocol/sdk-js';
import { z } from 'zod';
import * as Boom from '@hapi/boom';

import { getSession, setSession } from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { decryptRequestAttestation } from '../utilities/decryptMessage';
import { supportedCTypes } from '../utilities/supportedCTypes';
import { supportedCTypeKeys } from '../utilities/supportedCType';

import { paths } from './paths';

export type Output = void;

async function handler(
  request: Request<{ Params: { type: SupportedCType } }>,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const {
    logger,
    params: { type },
  } = request;
  logger.debug(`Request attestation started for ${type}`);

  const session = getSession(request.headers);
  if (!session.confirmed) {
    throw Boom.badRequest(`Claim has not been confirmed for ${type}`);
  }

  const { credential } = await decryptRequestAttestation(request);
  if (session.claim?.cTypeHash !== credential.claim.cTypeHash) {
    throw Boom.badRequest(
      `Request CType ${type} does not match confirmed claim cType`,
    );
  }

  session.claim.owner = credential.claim.owner;
  credential.claim = session.claim;

  const ctype = supportedCTypes[type];
  await Credential.verifyCredential(credential, { ctype });
  logger.debug(`Request attestation verified for ${type}`);

  setSession({ ...session, credential });

  return h.response().code(StatusCodes.NO_CONTENT);
}

const zodParams = z.object({ type: z.enum(supportedCTypeKeys) });

export const requestAttestation = {
  method: 'POST',
  path: paths.requestAttestation,
  handler,
  options: {
    validate: {
      params: async (params) => zodParams.parse(params),
      payload: validateEncryptedMessage,
    },
  },
} as ServerRoute;
