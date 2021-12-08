import { Request } from '@hapi/hapi';
import Boom from '@hapi/boom';
import { MessageBody, MessageBodyType } from '@kiltprotocol/types';
import { Message } from '@kiltprotocol/messaging';

import { encryptionKeystore } from './keystores';
import { EncryptedMessageInput } from './validateEncryptedMessage';

export function preDecryptMessageContent(
  expectedType: MessageBodyType,
  rejectionType?: MessageBodyType,
): (request: Request) => Promise<MessageBody['content'] | null> {
  return async function (request) {
    const { logger } = request;
    logger.debug('Message will be decrypted');

    const payload = request.payload as EncryptedMessageInput;
    const message = await Message.decrypt(payload.message, encryptionKeystore);
    logger.debug('Message decrypted');

    const messageBody = message.body;
    const { type } = messageBody;

    if (type === rejectionType) {
      logger.debug('Message contains rejection');
      return null;
    }

    if (type !== expectedType) {
      logger.debug('Message type is unexpected');
      throw Boom.badRequest('Unexpected message type');
    }

    return messageBody.content;
  };
}
