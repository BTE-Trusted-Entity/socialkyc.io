import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { RequestForAttestationUtils } from '@kiltprotocol/core';

import Boom from '@hapi/boom';

import { getSession, setSession } from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { decryptRequestAttestation } from '../utilities/decryptMessage';
import { paths } from '../endpoints/paths';

export type Output = void;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Email request attestation started');

  const session = getSession(request.headers);
  if (!session.confirmed) {
    throw Boom.badRequest('Email Claim has not been confirmed');
  }

  const { requestForAttestation } = await decryptRequestAttestation(request);
  if (session.claim?.cTypeHash !== requestForAttestation.claim.cTypeHash) {
    throw Boom.badRequest(
      'Email request CType does not match confirmed claim cType',
    );
  }

  session.claim.owner = requestForAttestation.claim.owner;
  requestForAttestation.claim = session.claim;

  RequestForAttestationUtils.errorCheck(requestForAttestation);
  logger.debug('Email request attestation verified');

  setSession({ ...session, requestForAttestation });

  return h.response().code(StatusCodes.NO_CONTENT);
}

export const requestAttestationEmail: ServerRoute = {
  method: 'POST',
  path: paths.email.requestAttestation,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
