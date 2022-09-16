import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import {
  IAttestation,
  ICredential,
  ICredentialPresentation,
} from '@kiltprotocol/types';
import { Attestation, Credential } from '@kiltprotocol/core';
import Boom from '@hapi/boom';
import { ConfigService } from '@kiltprotocol/config';

import { decryptMessageContent } from '../utilities/decryptMessage';
import { validateEncryptedMessage } from '../utilities/validateEncryptedMessage';
import { paths } from '../endpoints/paths';
import { getSession } from '../utilities/sessionStorage';

export interface Output {
  credential: ICredential;
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

  let attestation: IAttestation | undefined;
  let isAttested = false;
  try {
    await Credential.verifyPresentation(presentation, { challenge });

    const api = ConfigService.get('api');
    attestation = Attestation.fromChain(
      await api.query.attestation.attestations(presentation.rootHash),
      presentation.rootHash,
    );
    if (
      !attestation.revoked &&
      attestation.cTypeHash === presentation.claim.cTypeHash
    )
      isAttested = true;
  } catch {
  } finally {
    logger.debug('Verification completed');
    return h.response({
      credential: presentation,
      isAttested,
      attestation,
    } as Output);
  }
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
