import { IEncryptedMessage, IMessage } from '@kiltprotocol/types';
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
