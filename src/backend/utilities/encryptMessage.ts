import {
  Did,
  DidResourceUri,
  IEncryptedMessage,
  Message,
  MessageBody,
} from '@kiltprotocol/sdk-js';

import { encrypt } from './cryptoCallbacks';
import { configuration } from './configuration';

export async function encryptMessageBody(
  encryptionKeyUri: DidResourceUri,
  messageBody: MessageBody,
): Promise<IEncryptedMessage> {
  const { did } = Did.parse(encryptionKeyUri);

  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  const message = Message.fromBody(messageBody, configuration.did, did);
  return Message.encrypt(message, encrypt, encryptionKeyUri);
}
