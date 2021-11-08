import ky from 'ky';
import { StatusCodes } from 'http-status-codes';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { Output } from './sendEmail';
import { paths } from '../endpoints/paths';

export async function requestAttestationEmail(
  input: EncryptedMessageInput,
): Promise<Output> {
  const result = await ky.post(paths.email.requestAttestation, {
    json: input,
  });

  if (result.status === StatusCodes.ACCEPTED) {
    throw new Error('Terms rejected');
  }

  if (result.status !== StatusCodes.OK) {
    throw new Error('Not attested');
  }

  return result.text();
}
