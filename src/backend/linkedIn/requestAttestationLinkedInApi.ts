import ky from 'ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { Output } from './requestAttestationLinkedIn';

export async function requestAttestationLinkedIn(
  input: EncryptedMessageInput,
): Promise<Output> {
  await maybeRejected(
    ky.post(paths.linkedIn.requestAttestation, {
      json: input,
    }),
  );
}
