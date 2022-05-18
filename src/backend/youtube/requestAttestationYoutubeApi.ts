import { KyInstance } from 'ky/distribution/types/ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { Output } from './requestAttestationYoutube';

export async function requestAttestationYoutube(
  json: EncryptedMessageInput,
  ky: KyInstance,
): Promise<Output> {
  await maybeRejected(ky.post(paths.youtube.requestAttestation, { json }));
}
