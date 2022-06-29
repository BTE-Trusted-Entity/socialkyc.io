import {
  DidResourceUri,
  IEncryptedMessage,
  MessageBody,
} from '@kiltprotocol/types';
import { Message } from '@kiltprotocol/messaging';

import { Utils } from '@kiltprotocol/did';

import { fullDidPromise } from './fullDid';
import { encryptionKeystore } from './keystores';
import { configuration } from './configuration';

export async function encryptMessage(
  message: Message,
  encryptionKeyUri: DidResourceUri,
): Promise<IEncryptedMessage> {
  const { fullDid, encryptionKey } = await fullDidPromise;

  return message.encrypt(
    encryptionKey.id,
    fullDid,
    encryptionKeystore,
    encryptionKeyUri,
  );
}

export async function encryptMessageBody(
  encryptionKeyUri: DidResourceUri,
  messageBody: MessageBody,
): Promise<IEncryptedMessage> {
  const { did } = Utils.parseDidUri(encryptionKeyUri);
  const message = new Message(messageBody, configuration.did, did);
  return encryptMessage(message, encryptionKeyUri);
}
