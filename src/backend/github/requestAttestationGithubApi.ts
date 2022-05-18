import ky from 'ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { Output } from './requestAttestationGithub';

export async function requestAttestationGithub(
  input: EncryptedMessageInput,
): Promise<Output> {
  await maybeRejected(
    ky.post(paths.github.requestAttestation, {
      json: input,
    }),
  );
}
