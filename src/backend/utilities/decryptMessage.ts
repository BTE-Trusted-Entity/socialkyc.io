import { Request } from '@hapi/hapi';
import Boom from '@hapi/boom';
import {
  IEncryptedMessage,
  IMessage,
  MessageBody,
  MessageBodyType,
} from '@kiltprotocol/types';
import Message from '@kiltprotocol/messaging';
import { DefaultResolver, DidUtils } from '@kiltprotocol/did';

import { encryptionKeystore } from './keystores';

export async function decryptMessage(
  encrypted: IEncryptedMessage,
): Promise<IMessage> {
  const { senderKeyId } = encrypted;
  const { did } = DidUtils.parseDidUrl(senderKeyId);

  const didDocument = await DefaultResolver.resolveDoc(did);
  if (!didDocument) {
    throw new Error(`Cannot resolve the sender DID of key ${senderKeyId}`);
  }

  const { details: senderDetails } = didDocument;

  return Message.decrypt(encrypted, encryptionKeystore, { senderDetails });
}

export function preDecryptMessageContent(
  expectedType: MessageBodyType,
  rejectionType?: MessageBodyType,
): (request: Request) => Promise<MessageBody['content'] | null> {
  return async function (request) {
    const { logger } = request;
    logger.debug('Message will be decrypted');

    const message = await decryptMessage(request.payload as IEncryptedMessage);
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
