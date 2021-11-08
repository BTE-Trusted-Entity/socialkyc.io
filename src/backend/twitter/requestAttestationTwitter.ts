import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import {
  IRequestAttestationForClaimContent,
  MessageBodyType,
} from '@kiltprotocol/types';

import { cacheRequestForAttestation } from '../utilities/requestCache';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { preDecryptMessageContent } from '../utilities/decryptMessage';
import { tweetsListeners } from './tweets';
import { makeControlledPromise } from '../utilities/makeControlledPromise';
import { paths } from '../endpoints/paths';

export interface Output {
  key: string;
  code: string;
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter request attestation started');

  if (!request.pre.content) {
    return h.response().code(StatusCodes.ACCEPTED);
  }

  const content = request.pre.content as IRequestAttestationForClaimContent;
  const { requestForAttestation } = content;

  const key = requestForAttestation.rootHash;
  cacheRequestForAttestation(key, requestForAttestation);
  logger.debug('Twitter request attestation cached');

  const code = String(Math.random()).substring(2);
  const username = requestForAttestation.claim.contents['Twitter'] as string;

  const confirmation = makeControlledPromise<void>();
  tweetsListeners[username] = [code, confirmation];
  logger.debug('Twitter request attestation listener added');

  return h.response({ key, code } as Output);
}

export const requestTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.requestAttestation,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
    pre: [
      {
        assign: 'content',
        method: preDecryptMessageContent(
          MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM,
          MessageBodyType.REJECT_TERMS,
        ),
      },
    ],
  },
};
