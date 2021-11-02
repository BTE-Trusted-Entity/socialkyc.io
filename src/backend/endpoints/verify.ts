import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { MessageBodyType } from '@kiltprotocol/types';
import { AttestedClaim } from '@kiltprotocol/core';
import { errorCheckMessageBody } from '@kiltprotocol/messaging';

import { decryptMessage } from '../utilities/decryptMessage';
import {
  Payload,
  validateEncryptedMessage,
} from '../utilities/validateEncryptedMessage';
import { paths } from './paths';

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Verification started');

  const encrypted = request.payload as Payload;
  const message = await decryptMessage(encrypted);

  const messageBody = message.body;
  errorCheckMessageBody(messageBody);
  logger.debug('Verification message decrypted and verified');

  if (messageBody.type !== MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES) {
    logger.debug('Verification unexpected message type');
    return h.response().code(StatusCodes.NOT_ACCEPTABLE);
  }

  const credential = AttestedClaim.fromAttestedClaim(messageBody.content[0]);
  logger.debug('Verification credential constructed');

  const isAttested = await credential.verify();

  logger.debug('Verification completed');
  return h.response({ credential, isAttested });
}

export const verify: ServerRoute = {
  method: 'POST',
  path: paths.verify,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
