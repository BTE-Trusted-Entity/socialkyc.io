import {
  IDidKeyDetails,
  IEncryptedMessage,
  MessageBody,
} from '@kiltprotocol/types';
import { Message } from '@kiltprotocol/messaging';
import { DefaultResolver } from '@kiltprotocol/did';

import { fullDidPromise } from './fullDid';
import { encryptionKeystore } from './keystores';
import { configuration } from './configuration';

export async function encryptMessage(
  message: Message,
  encryptionKeyId: IDidKeyDetails['id'],
): Promise<IEncryptedMessage> {
  const receiverEncryptionKey = await DefaultResolver.resolveKey(
    encryptionKeyId,
  );
  if (!receiverEncryptionKey) {
    throw new Error(`Cannot resolve the receiver DID key ${encryptionKeyId}`);
  }

  const { encryptionKey } = await fullDidPromise;
  return message.encrypt(
    encryptionKey,
    receiverEncryptionKey,
    encryptionKeystore,
  );
}

export async function encryptMessageBody(
  encryptionKeyId: IDidKeyDetails['id'],
  messageBody: MessageBody,
): Promise<IEncryptedMessage> {
  // TODO: restore that after the SDK fixes parsing of light DIDs
  // const { did } = DidUtils.parseDidUrl(encryptionKeyId);
  const did = encryptionKeyId.replace(/#.*$/, '');
  const message = new Message(messageBody, configuration.did, did);
  return encryptMessage(message, encryptionKeyId);
}
