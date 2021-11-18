import ky from 'ky';
import { StatusCodes } from 'http-status-codes';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { Output } from './requestAttestationDotsama';
import { paths } from '../endpoints/paths';

export async function requestAttestationDotsama(
  input: EncryptedMessageInput,
): Promise<Output> {
  const result = await ky.post(paths.dotsama.requestAttestation, {
    json: input,
  });

  if (result.status === StatusCodes.ACCEPTED) {
    throw new Error('Terms rejected');
  }

  if (result.status !== StatusCodes.NO_CONTENT) {
    throw new Error('Not attested');
  }

  return undefined;
}
