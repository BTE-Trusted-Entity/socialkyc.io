import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import {
  IRequestAttestationContent,
  MessageBodyType,
} from '@kiltprotocol/types';

import {
  getSecretForSession,
  getSession,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { preDecryptMessageContent } from '../utilities/decryptMessage';
import { makeControlledPromise } from '../utilities/makeControlledPromise';
import { paths } from '../endpoints/paths';

import { tweetsListeners } from './tweets';

export interface Output {
  secret: string;
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

  const content = request.pre.content as IRequestAttestationContent;
  const { requestForAttestation } = content;

  const session = getSession(request.payload as PayloadWithSession);
  delete session.attestedMessagePromise;
  setSession({ ...session, requestForAttestation, confirmed: false });
  logger.debug('Twitter request attestation cached');

  const secret = getSecretForSession(session.sessionId);
  const username = requestForAttestation.claim.contents['Twitter'] as string;

  const confirmation = makeControlledPromise<void>();
  tweetsListeners.set(username.toLowerCase(), [secret, confirmation]);
  logger.debug('Twitter request attestation listener added');

  return h.response({ secret } as Output);
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
          MessageBodyType.REQUEST_ATTESTATION,
          MessageBodyType.REJECT_TERMS,
        ),
      },
    ],
  },
};
