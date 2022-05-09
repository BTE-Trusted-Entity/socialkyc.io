import ky from 'ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { Output } from './requestAttestationTelegram';

export async function requestAttestationTelegram(
  input: EncryptedMessageInput,
): Promise<Output> {
  await maybeRejected(
    ky.post(paths.telegram.requestAttestation, {
      json: input,
    }),
  );
}
