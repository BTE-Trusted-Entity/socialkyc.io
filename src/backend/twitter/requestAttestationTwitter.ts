import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import * as Boom from '@hapi/boom';

import { Credential } from '@kiltprotocol/core';

import { StatusCodes } from 'http-status-codes';

import { getSession, setSession } from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { decryptRequestAttestation } from '../utilities/decryptMessage';
import { paths } from '../endpoints/paths';

import { twitterCType } from './twitterCType';

export type Output = void;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter request attestation started');

  const session = getSession(request.headers);
  if (!session.confirmed) {
    throw Boom.badRequest('Twitter Claim has not been confirmed');
  }

  const { credential } = await decryptRequestAttestation(request);
  if (session.claim?.cTypeHash !== credential.claim.cTypeHash) {
    throw Boom.badRequest(
      'Twitter request CType does not match confirmed claim cType',
    );
  }

  session.claim.owner = credential.claim.owner;
  credential.claim = session.claim;

  await Credential.verifyCredential(credential, { ctype: twitterCType });
  logger.debug('Twitter request attestation verified');

  setSession({ ...session, credential });

  return h.response().code(StatusCodes.NO_CONTENT);
}

export const requestAttestationTwitter: ServerRoute = {
  method: 'POST',
  path: paths.twitter.requestAttestation,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
