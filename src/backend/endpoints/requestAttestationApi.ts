import type { KyInstance } from 'ky/distribution/types/ky';

import type { SupportedCTypes } from '../utilities/supportedCTypes';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { paths } from './paths';

import { Output } from './requestAttestation';

export async function requestAttestation(
  type: SupportedCTypes,
  json: EncryptedMessageInput,
  ky: KyInstance,
): Promise<Output> {
  await maybeRejected(ky.post(`${paths.requestAttestation}/${type}`, { json }));
}
