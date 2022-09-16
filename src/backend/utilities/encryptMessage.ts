import {
  DidResourceUri,
  IEncryptedMessage,
  IMessage,
  MessageBody,
} from '@kiltprotocol/types';
import * as Message from '@kiltprotocol/messaging';

import { Utils } from '@kiltprotocol/did';

import { fullDidPromise } from './fullDid';
import { encryptCallback } from './keystores';
import { configuration } from './configuration';

export async function encryptMessage(
  message: IMessage,
  encryptionKeyUri: DidResourceUri,
): Promise<IEncryptedMessage> {
  const { fullDid, encryptionKey } = await fullDidPromise;

  return Message.encrypt(
    message,
    encryptionKey.id,
    fullDid,
    encryptCallback,
    encryptionKeyUri,
  );
}

export async function encryptMessageBody(
  encryptionKeyUri: DidResourceUri,
  messageBody: MessageBody,
): Promise<IEncryptedMessage> {
  const { did } = Utils.parseDidUri(encryptionKeyUri);

  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  const message = Message.fromBody(messageBody, configuration.did, did);
  return encryptMessage(message, encryptionKeyUri);
}
