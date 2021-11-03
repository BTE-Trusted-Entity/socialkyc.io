import ky from 'ky';
import { StatusCodes } from 'http-status-codes';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { Output } from './requestAttestationTwitter';
import { paths } from './paths';

export async function requestAttestationTwitter(
  input: EncryptedMessageInput,
): Promise<Output> {
  const result = await ky.post(paths.requestAttestationTwitter, {
    json: input,
  });

  if (result.status === StatusCodes.ACCEPTED) {
    throw new Error('Terms rejected');
  }

  if (result.status !== StatusCodes.OK) {
    throw new Error('Not attested');
  }

  return result.json();
}
