import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { ICredential, MessageBodyType } from '@kiltprotocol/types';
import { Credential } from '@kiltprotocol/core';
import Boom from '@hapi/boom';

import { decryptMessageContent } from '../utilities/decryptMessage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { getSession } from '../utilities/sessionStorage';

export interface Output {
  credential: Credential;
  isAttested: boolean;
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Verification started');

  const content = await decryptMessageContent<ICredential[]>(
    request,
    MessageBodyType.SUBMIT_CREDENTIAL,
  );

  const session = getSession(request.headers);
  if (!session.requestChallenge) {
    throw Boom.forbidden('No request challenge');
  }
  const challenge = session.requestChallenge;

  const credential = Credential.fromCredential(content[0]);
  logger.debug('Verification credential constructed');

  const isAttested = await credential.verify({ challenge });

  logger.debug('Verification completed');
  return h.response({ credential, isAttested } as Output);
}

export const verify: ServerRoute = {
  method: 'POST',
  path: paths.verifier.verify,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
