import { Request } from '@hapi/hapi';
import Boom from '@hapi/boom';
import {
  MessageBodyType,
  IRequestAttestationContent,
} from '@kiltprotocol/types';
import * as Message from '@kiltprotocol/messaging';

import { decrypt } from './cryptoCallbacks';
import { EncryptedMessageInput } from './validateEncryptedMessage';

export async function decryptMessageContent<Result>(
  request: Request,
  expectedType: MessageBodyType,
  rejectionType?: MessageBodyType,
): Promise<Result> {
  const { logger } = request;
  logger.debug('Message will be decrypted');

  const payload = request.payload as EncryptedMessageInput;
  const message = await Message.decrypt(payload.message, decrypt);
  logger.debug('Message decrypted');

  const messageBody = message.body;
  Message.verifyMessageBody(messageBody);
  const { type } = messageBody;

  if (type === rejectionType || type === 'reject') {
    logger.debug('Message contains rejection');
    throw Boom.conflict('Message contains rejection');
  }

  if (type !== expectedType) {
    logger.debug('Message type is unexpected');
    throw Boom.badRequest('Unexpected message type');
  }

  return messageBody.content as Result;
}

export async function decryptRequestAttestation(
  request: Request,
): Promise<IRequestAttestationContent> {
  return decryptMessageContent<IRequestAttestationContent>(
    request,
    'request-attestation',
    'reject-terms',
  );
}
