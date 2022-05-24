import ky from 'ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { sessionHeader } from '../endpoints/sessionHeader';

import { Output } from './verify';

export async function verifyCredential(
  json: EncryptedMessageInput,
  sessionId: string,
): Promise<Output> {
  const headers = { [sessionHeader]: sessionId };
  return ky.post(paths.verifier.verify, { json, headers }).json();
}
