import ky from 'ky';
import { StatusCodes } from 'http-status-codes';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';

import { Output } from './requestAttestationTwitch';

export async function requestAttestationTwitch(
  input: EncryptedMessageInput,
): Promise<Output> {
  const result = await ky.post(paths.twitch.requestAttestation, {
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
