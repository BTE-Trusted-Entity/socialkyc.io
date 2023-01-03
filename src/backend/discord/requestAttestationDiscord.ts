import { StatusCodes } from 'http-status-codes';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';

import { Credential } from '@kiltprotocol/core';

import Boom from '@hapi/boom';

import { getSession, setSession } from '../utilities/sessionStorage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { decryptRequestAttestation } from '../utilities/decryptMessage';
import { paths } from '../endpoints/paths';

import { discordCType } from './discordCType';

export type Output = void;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Discord request attestation started');

  const session = getSession(request.headers);
  if (!session.confirmed) {
    throw Boom.badRequest('Discord Claim has not been confirmed');
  }

  const { credential } = await decryptRequestAttestation(request);
  if (session.claim?.cTypeHash !== credential.claim.cTypeHash) {
    throw Boom.badRequest(
      'Discord request CType does not match confirmed claim cType',
    );
  }

  session.claim.owner = credential.claim.owner;
  credential.claim = session.claim;

  await Credential.verifyCredential(credential, { ctype: discordCType });
  logger.debug('Discord request attestation verified');

  setSession({ ...session, credential });

  return h.response().code(StatusCodes.NO_CONTENT);
}

export const requestAttestationDiscord: ServerRoute = {
  method: 'POST',
  path: paths.discord.requestAttestation,
  handler,
  options: {
    validate: {
      payload: validateEncryptedMessage,
    },
  },
};
