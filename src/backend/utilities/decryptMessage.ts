import { IEncryptedMessage, IMessage } from '@kiltprotocol/types';
import Message from '@kiltprotocol/messaging';
import { DefaultResolver, DidUtils } from '@kiltprotocol/did';

import { encryptionKeystore } from './keystores';

export async function decryptMessage(
  encrypted: IEncryptedMessage,
): Promise<IMessage> {
  const { senderKeyId } = encrypted;
  const { did } = DidUtils.parseDidUrl(senderKeyId);

  const senderDetails = await DefaultResolver.resolveDoc(did);
  if (!senderDetails) {
    throw new Error(`Cannot resolve the sender DID of key ${senderKeyId}`);
  }

  return Message.decrypt(encrypted, encryptionKeystore, { senderDetails });
}
