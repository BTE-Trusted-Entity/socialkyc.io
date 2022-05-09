import ky from 'ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';

import { Output } from './verify';

export async function verifyCredential(
  input: EncryptedMessageInput,
): Promise<Output> {
  return ky.post(paths.verifier.verify, { json: input }).json();
}
