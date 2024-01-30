import type { Request } from '@hapi/hapi';
import type { EncryptedMessageInput } from './validateEncryptedMessage';
import type {
  IRequestAttestationContent,
  MessageBodyType,
} from '@kiltprotocol/extension-api/types';

import * as Message from '@kiltprotocol/extension-api/messaging';

import * as Boom from '@hapi/boom';

import { decrypt } from './cryptoCallbacks';

export async function decryptMessageContent<Result>(
  request: Pick<Request, 'payload' | 'logger'>,
  expectedType: MessageBodyType,
  rejectionType?: MessageBodyType,
): Promise<Result> {
  const { logger } = request;
  logger.debug('Message will be decrypted');

  const payload = request.payload as EncryptedMessageInput;
  const message = await Message.decrypt(payload.message, decrypt);
  logger.debug('Message decrypted');

  const messageBody = message.body;
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
  request: Pick<Request, 'payload' | 'logger'>,
): Promise<IRequestAttestationContent> {
  return decryptMessageContent<IRequestAttestationContent>(
    request,
    'request-attestation',
    'reject-terms',
  );
}
