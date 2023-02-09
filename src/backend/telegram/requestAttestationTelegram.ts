import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { Credential } from '@kiltprotocol/core';

import * as Boom from '@hapi/boom';

import { getSession, setSession } from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { decryptRequestAttestation } from '../utilities/decryptMessage';
import { paths } from '../endpoints/paths';

import { telegramCType } from './telegramCType';

export type Output = void;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Telegram request attestation started');

  const session = getSession(request.headers);
  if (!session.confirmed) {
    throw Boom.badRequest('Telegram claim has not been confirmed');
  }

  const { credential } = await decryptRequestAttestation(request);
  if (session.claim?.cTypeHash !== credential.claim.cTypeHash) {
    throw Boom.badRequest(
      'Telegram request CType does not match confirmed claim cType',
    );
  }

  session.claim.owner = credential.claim.owner;
  credential.claim = session.claim;

  await Credential.verifyCredential(credential, { ctype: telegramCType });

  logger.debug('Telegram request attestation verified');
  setSession({ ...session, credential });

  return h.response().code(StatusCodes.NO_CONTENT);
}

export const requestAttestationTelegram: ServerRoute = {
  method: 'POST',
  path: paths.telegram.requestAttestation,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
