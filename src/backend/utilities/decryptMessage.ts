import { Request } from '@hapi/hapi';
import Boom from '@hapi/boom';
import {
  MessageBodyType,
  IRequestAttestationContent,
} from '@kiltprotocol/types';
import * as Message from '@kiltprotocol/messaging';

import { decryptCallback } from './keystores';
import { EncryptedMessageInput } from './validateEncryptedMessage';
import { fullDidPromise } from './fullDid';

export async function decryptMessageContent<Result>(
  request: Request,
  expectedType: MessageBodyType,
  rejectionType?: MessageBodyType,
): Promise<Result> {
  const { logger } = request;
  logger.debug('Message will be decrypted');

  const payload = request.payload as EncryptedMessageInput;
  const { fullDid } = await fullDidPromise;
  const message = await Message.decrypt(
    payload.message,
    decryptCallback,
    fullDid,
  );
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
  request: Request,
): Promise<IRequestAttestationContent> {
  const {credential,
    // @ts-expect-error Support for the old message type, where the credential prop was called requestForAttestation
    requestForAttestation,
    ...rest } = await decryptMessageContent<IRequestAttestationContent>(
    request,
    'request-attestation',
    'reject-terms',
  );
  return {...rest, credential: credential ?? requestForAttestation}
}
