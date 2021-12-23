import ky from 'ky';
import { StatusCodes } from 'http-status-codes';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';

import { paths } from '../endpoints/paths';

import { Output } from './verify';

export async function verifyCredential(
  input: EncryptedMessageInput,
): Promise<Output> {
  const result = await ky.post(paths.verifier.verify, { json: input });

  if (result.status !== StatusCodes.OK) {
    throw new Error('Credential verification failed');
  }

  return result.json();
}
