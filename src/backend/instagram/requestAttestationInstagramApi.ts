import ky from 'ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { Output } from './requestAttestationInstagram';

export async function requestAttestationInstagram(
  input: EncryptedMessageInput,
): Promise<Output> {
  await maybeRejected(
    ky.post(paths.instagram.requestAttestation, {
      json: input,
    }),
  );
}
