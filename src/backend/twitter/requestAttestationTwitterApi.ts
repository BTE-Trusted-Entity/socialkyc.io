import { KyInstance } from 'ky/distribution/types/ky';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { Output } from './requestAttestationTwitter';

export async function requestAttestationTwitter(
  json: EncryptedMessageInput,
  ky: KyInstance,
): Promise<Output> {
  return maybeRejected(ky.post(paths.twitter.requestAttestation, { json }));
}
