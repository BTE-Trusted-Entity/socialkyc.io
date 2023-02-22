import type { KyInstance } from 'ky/distribution/types/ky';

import type { SupportedCType } from '../utilities/supportedCType';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { maybeRejected } from '../../frontend/utilities/maybeRejected';

import { generatePath, paths } from './paths';

import { Output } from './requestAttestation';

export async function requestAttestation(
  type: SupportedCType,
  json: EncryptedMessageInput,
  ky: KyInstance,
): Promise<Output> {
  const url = generatePath(paths.requestAttestation, type);
  await maybeRejected(ky.post(url, { json }));
}
