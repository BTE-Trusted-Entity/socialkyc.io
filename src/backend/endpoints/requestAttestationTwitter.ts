import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { MessageBodyType } from '@kiltprotocol/types';
import { errorCheckMessageBody } from '@kiltprotocol/messaging';
import { RequestForAttestation } from '@kiltprotocol/core';

import { cacheRequestForAttestation } from '../utilities/requestCache';
import { decryptMessage } from '../utilities/decryptMessage';
import {
  Payload,
  validateEncryptedMessage,
} from '../utilities/validateEncryptedMessage';
import { tweetsListeners } from '../utilities/tweets';
import { makeControlledPromise } from '../utilities/makeControlledPromise';
import { paths } from './paths';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter request attestation started');

  const encrypted = request.payload as Payload;
  const message = await decryptMessage(encrypted);

  const messageBody = message.body;
  errorCheckMessageBody(messageBody);
  logger.debug('Twitter request attestation decrypted and verified');

  const { type } = messageBody;
  if (type === MessageBodyType.REJECT_TERMS) {
    logger.debug('Twitter request attestation received rejection');
    return h.response().code(StatusCodes.ACCEPTED);
  }
  if (type !== MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM) {
    logger.debug('Twitter request attestation unexpected message type');
    return h.response().code(StatusCodes.NOT_ACCEPTABLE);
  }

  const { requestForAttestation } = messageBody.content;
  if (!RequestForAttestation.isIRequestForAttestation(requestForAttestation)) {
    throw Boom.badRequest('Invalid request for attestation');
  }

  RequestForAttestation.verifyData(requestForAttestation);
  logger.debug('Twitter request attestation verified');

  const key = requestForAttestation.rootHash;
  cacheRequestForAttestation(key, requestForAttestation);
  logger.debug('Twitter request attestation cached');

  const code = String(Math.random()).substring(2);
  const username = requestForAttestation.claim.contents['Twitter'] as string;

  const confirmation = makeControlledPromise<void>();
  tweetsListeners[username] = [code, confirmation];
  logger.debug('Twitter request attestation listener added');

  return h.response({ key, code, username });
}

export const requestTwitter: ServerRoute = {
  method: 'POST',
  path: paths.requestAttestationTwitter,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
