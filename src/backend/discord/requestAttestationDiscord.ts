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

import Boom from '@hapi/boom';

import {
  getSession,
  PayloadWithSession,
  setSession,
} from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { preDecryptMessageContent } from '../utilities/decryptMessage';
import { paths } from '../endpoints/paths';

export type Output = Record<string, never>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Discord request attestation started');

  if (!request.pre.content) {
    return h.response().code(StatusCodes.ACCEPTED);
  }

  const content = request.pre.content as IRequestAttestationContent;
  const { requestForAttestation } = content;

  const session = getSession(request.payload as PayloadWithSession);

  if (session.claim.cTypeHash !== requestForAttestation.claim.cTypeHash) {
    throw Boom.badRequest('CType does not match claim');
  }

  if (!session.confirmed) {
    throw Boom.badRequest('Claim has not been confirmed');
  }

  setSession({ ...session, requestForAttestation });

  logger.debug('Discord request attestation cached');

  return h.response({}).code(StatusCodes.OK);
}

export const requestAttestationDiscord: ServerRoute = {
  method: 'POST',
  path: paths.discord.requestAttestation,
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
