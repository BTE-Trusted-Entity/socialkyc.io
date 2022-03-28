import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import {
  IRequestAttestationContent,
  MessageBodyType,
} from '@kiltprotocol/types';

import { RequestForAttestationUtils } from '@kiltprotocol/core';

import Boom from '@hapi/boom';

import {
  getSession,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { preDecryptMessageContent } from '../utilities/decryptMessage';
import { paths } from '../endpoints/paths';

import { exceptionToError } from '../../frontend/utilities/exceptionToError';

export type Output = Record<string, never>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Github request attestation started');

  if (!request.pre.content) {
    return h.response().code(StatusCodes.ACCEPTED);
  }

  const content = request.pre.content as IRequestAttestationContent;
  const { requestForAttestation } = content;

  const session = getSession(request.payload as PayloadWithSession);

  if (!session.confirmed) {
    throw Boom.badRequest('Github Claim has not been confirmed');
  }

  if (session.claim?.cTypeHash !== requestForAttestation.claim.cTypeHash) {
    throw Boom.badRequest(
      'Github request CType does not match confirmed claim cType',
    );
  }

  session.claim.owner = requestForAttestation.claim.owner;
  requestForAttestation.claim = session.claim;

  try {
    RequestForAttestationUtils.errorCheck(requestForAttestation);
  } catch (exception) {
    throw Boom.boomify(exceptionToError(exception));
  }

  logger.debug('Github request attestation verified');

  setSession({ ...session, requestForAttestation });

  logger.debug('Github request attestation cached');

  return h.response({}).code(StatusCodes.OK);
}

export const requestAttestationGithub: ServerRoute = {
  method: 'POST',
  path: paths.github.requestAttestation,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
    pre: [
      {
        assign: 'content',
        method: preDecryptMessageContent(
          MessageBodyType.REQUEST_ATTESTATION,
          MessageBodyType.REJECT_TERMS,
        ),
      },
    ],
  },
};
