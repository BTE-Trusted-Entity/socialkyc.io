import type { KyInstance } from 'ky/distribution/types/ky';

import type { SupportedCType } from '../utilities/supportedCType';

import { StatusCodes } from 'http-status-codes';

import { EncryptedMessageInput } from '../utilities/validateEncryptedMessage';
import { isHttpStatusCode } from '../../frontend/utilities/isHttpStatusCode';
import { ExplicitRejection } from '../../frontend/utilities/session';

import { generatePath, paths } from './paths';

import { Output } from './requestAttestation';

export async function requestAttestation(
  type: SupportedCType,
  json: EncryptedMessageInput,
  ky: KyInstance,
): Promise<Output> {
  try {
    const url = generatePath(paths.requestAttestation, type);
    await ky.post(url, { json });
  } catch (exception) {
    if (isHttpStatusCode(exception, StatusCodes.CONFLICT)) {
      throw new ExplicitRejection('Terms rejected');
    }
    throw exception;
  }
}
