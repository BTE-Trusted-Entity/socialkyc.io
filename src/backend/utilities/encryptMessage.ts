import type { DidUrl } from '@kiltprotocol/types';
import type {
  IEncryptedMessage,
  MessageBody,
} from '@kiltprotocol/extension-api/types';

import { parse } from '@kiltprotocol/did';
import * as Message from '@kiltprotocol/extension-api/messaging';

import { encrypt } from './cryptoCallbacks';
import { configuration } from './configuration';

export async function encryptMessageBody(
  encryptionKeyUri: DidUrl,
  messageBody: MessageBody,
): Promise<IEncryptedMessage> {
  const { did } = parse(encryptionKeyUri);

  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  const message = Message.fromBody(messageBody, configuration.did, did);
  return Message.encrypt(message, encrypt, encryptionKeyUri);
}
