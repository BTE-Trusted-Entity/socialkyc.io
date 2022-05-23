import ky from 'ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';

import { Output } from './verify';

export async function verifyCredential(
  json: EncryptedMessageInput,
  sessionId: string,
): Promise<Output> {
  const headers = { Authorization: sessionId };
  return ky.post(paths.verifier.verify, { json, headers }).json();
}
