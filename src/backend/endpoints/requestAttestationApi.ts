import type { KyInstance } from 'ky/distribution/types/ky';

import type { SupportedCTypes } from '../utilities/supportedCTypes';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { generatePath, paths } from './paths';

import { Output } from './requestAttestation';

export async function requestAttestation(
  type: SupportedCTypes,
  json: EncryptedMessageInput,
  ky: KyInstance,
): Promise<Output> {
  const url = generatePath(paths.requestAttestation, type);
  await maybeRejected(ky.post(url, { json }));
}
