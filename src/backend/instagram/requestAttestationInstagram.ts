import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { RequestForAttestationUtils } from '@kiltprotocol/core';

import Boom from '@hapi/boom';

import {
  getSession,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { decryptRequestAttestationContent } from '../utilities/decryptMessage';
import { paths } from '../endpoints/paths';

export type Output = Record<string, never>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Instagram request attestation started');

  const content = await decryptRequestAttestationContent(request);
  if (!content) {
    return h.response().code(StatusCodes.ACCEPTED);
  }

  const { requestForAttestation } = content;

  const session = getSession(request.payload as PayloadWithSession);

  if (!session.confirmed) {
    throw Boom.badRequest('Instagram Claim has not been confirmed');
  }

  if (session.claim?.cTypeHash !== requestForAttestation.claim.cTypeHash) {
    throw Boom.badRequest(
      'Instagram request CType does not match confirmed claim cType',
    );
  }

  session.claim.owner = requestForAttestation.claim.owner;
  requestForAttestation.claim = session.claim;

  RequestForAttestationUtils.errorCheck(requestForAttestation);

  logger.debug('Instagram request attestation verified');

  setSession({ ...session, requestForAttestation });

  logger.debug('Instagram request attestation cached');

  return h.response({}).code(StatusCodes.OK);
}

export const requestAttestationInstagram: ServerRoute = {
  method: 'POST',
  path: paths.instagram.requestAttestation,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};