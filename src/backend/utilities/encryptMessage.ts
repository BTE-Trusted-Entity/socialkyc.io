import {
  IDidDetails,
  IEncryptedMessage,
  KeyRelationship,
} from '@kiltprotocol/types';
import Message from '@kiltprotocol/messaging';
import { DefaultResolver } from '@kiltprotocol/did';

import { fullDidPromise } from './fullDid';
import { encryptionKeystore } from './keystores';

export async function encryptMessage(
  message: Message,
  receiverDid: IDidDetails['did'],
): Promise<IEncryptedMessage> {
  const didDocument = await DefaultResolver.resolveDoc(receiverDid);
  if (!didDocument) {
    throw new Error(`Cannot resolve the receiver DID ${receiverDid}`);
  }

  const { details: receiver } = didDocument;

  const receiverEncryptionKey = receiver
    .getKeys(KeyRelationship.keyAgreement)
    .pop();
  if (!receiverEncryptionKey) {
    throw new Error('Receiver key agreement key not found');
  }

  const { encryptionKey } = await fullDidPromise;
  return message.encrypt(
    encryptionKey,
    receiverEncryptionKey,
    encryptionKeystore,
  );
}
