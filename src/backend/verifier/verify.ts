import type {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import * as Boom from '@hapi/boom';
import {
  Credential,
  DidUri,
  ICredentialPresentation,
} from '@kiltprotocol/sdk-js';

import { decryptMessageContent } from '../utilities/decryptMessage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { getSession } from '../utilities/sessionStorage';

export interface Output {
  presentation: ICredentialPresentation;
  isAttested: boolean;
  revoked?: boolean;
  attester?: DidUri;
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Verification started');

  const content = await decryptMessageContent<ICredentialPresentation[]>(
    request,
    'submit-credential',
  );

  const session = getSession(request.headers);
  if (!session.requestChallenge) {
    throw Boom.forbidden('No request challenge');
  }
  const challenge = session.requestChallenge;

  const presentation = content[0];
  logger.debug('Verification credential constructed');

  try {
    const { revoked, attester } = await Credential.verifyPresentation(
      presentation,
      { challenge },
    );

    const isAttested = !revoked;

    return h.response({
      presentation,
      isAttested,
      revoked,
      attester,
    } as Output);
  } catch {
    return h.response({ presentation, isAttested: false } as Output);
  } finally {
    logger.debug('Verification completed');
  }
}

export const verify = {
  method: 'POST',
  path: paths.verifier.verify,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
} as ServerRoute;
