import ky from 'ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { Output } from './requestAttestationTwitch';

export async function requestAttestationTwitch(
  input: EncryptedMessageInput,
): Promise<Output> {
  await maybeRejected(
    ky.post(paths.twitch.requestAttestation, {
      json: input,
    }),
  );
}
