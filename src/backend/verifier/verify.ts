import type {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import type {
  IAttestation,
  ICredentialPresentation,
} from '@kiltprotocol/types';

import { Attestation, Credential } from '@kiltprotocol/core';
import * as Boom from '@hapi/boom';
import { ConfigService } from '@kiltprotocol/config';

import { decryptMessageContent } from '../utilities/decryptMessage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { getSession } from '../utilities/sessionStorage';

export interface Output {
  presentation: ICredentialPresentation;
  isAttested: boolean;
  attestation?: IAttestation;
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
    await Credential.verifyPresentation(presentation, { challenge });

    const api = ConfigService.get('api');
    const attestation = Attestation.fromChain(
      await api.query.attestation.attestations(presentation.rootHash),
      presentation.rootHash,
    );

    const isAttested =
      !attestation.revoked &&
      attestation.cTypeHash === presentation.claim.cTypeHash;

    return h.response({ presentation, isAttested, attestation } as Output);
  } catch {
    return h.response({ presentation, isAttested: false } as Output);
  } finally {
    logger.debug('Verification completed');
  }

  logger.debug('Verification completed');
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
