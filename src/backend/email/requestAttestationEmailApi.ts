import { KyInstance } from 'ky/distribution/types/ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { Output } from './requestAttestationEmail';

export async function requestAttestationEmail(
  json: EncryptedMessageInput,
  ky: KyInstance,
): Promise<Output> {
  await maybeRejected(ky.post(paths.email.requestAttestation, { json }));
}
