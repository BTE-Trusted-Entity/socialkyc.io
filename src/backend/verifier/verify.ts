import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import { MessageBodyType, ICredential } from '@kiltprotocol/types';
import { Credential } from '@kiltprotocol/core';

import { preDecryptMessageContent } from '../utilities/decryptMessage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';

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

  if (!request.pre.content) {
    return h.response().code(StatusCodes.ACCEPTED);
  }
  const content = request.pre.content as ICredential[];

  const credential = Credential.fromCredential(content[0]);
  logger.debug('Verification credential constructed');

  const isAttested = await credential.verify();

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
    pre: [
      {
        assign: 'content',
        method: preDecryptMessageContent(MessageBodyType.SUBMIT_CREDENTIAL),
      },
    ],
  },
};
