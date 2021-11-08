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
  EncryptedMessageInput,
  validateEncryptedMessage,
} from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';

export interface Output {
  credential: AttestedClaim;
  isAttested: boolean;
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Verification started');

  const encrypted = request.payload as EncryptedMessageInput;
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
  return h.response({ credential, isAttested } as Output);
}

export const verify: ServerRoute = {
  method: 'POST',
  path: paths.verifier.verify,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
