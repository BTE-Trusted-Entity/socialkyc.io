import {
  DidPublicKey,
  IEncryptedMessage,
  MessageBody,
} from '@kiltprotocol/types';
import { Message } from '@kiltprotocol/messaging';

import { fullDidPromise } from './fullDid';
import { encryptionKeystore } from './keystores';
import { configuration } from './configuration';

export async function encryptMessage(
  message: Message,
  encryptionKeyId: DidPublicKey['id'],
): Promise<IEncryptedMessage> {
  const { fullDid, encryptionKey } = await fullDidPromise;

  return message.encrypt(
    encryptionKey.id,
    fullDid,
    encryptionKeystore,
    encryptionKeyId,
  );
}

export async function encryptMessageBody(
  encryptionKeyId: DidPublicKey['id'],
  messageBody: MessageBody,
): Promise<IEncryptedMessage> {
  // TODO: restore that after the SDK fixes parsing of light DIDs
  // const { did } = DidUtils.parseDidUrl(encryptionKeyId);
  const did = encryptionKeyId.replace(/#.*$/, '');
  const message = new Message(messageBody, configuration.did, did);
  return encryptMessage(message, encryptionKeyId);
}
