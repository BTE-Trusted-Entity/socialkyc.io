import Boom from '@hapi/boom';
import { Logger } from 'pino';
import {
  IEncryptedMessage,
  IRequestForAttestation,
  MessageBodyType,
} from '@kiltprotocol/types';
import { Attestation } from '@kiltprotocol/core';

import { configuration } from './configuration';
import { batchSignAndSubmitAttestation } from './batchSignAndSubmitAttestation';
import { encryptMessageBody } from './encryptMessage';
import { getSessionWithDid, Session, setSession } from './sessionStorage';

export async function attestClaim(
  requestForAttestation: IRequestForAttestation,
): Promise<Attestation> {
  const attestation = Attestation.fromRequestAndDid(
    requestForAttestation,
    configuration.did,
  );

  await batchSignAndSubmitAttestation(attestation);

  return attestation;
}

export async function startAttestation(
  session: Session,
  logger: Logger,
): Promise<Attestation> {
  const { requestForAttestation, confirmed } = getSessionWithDid(session);
  if (!requestForAttestation || !confirmed) {
    throw Boom.notFound('Confirmed requestForAttestation not found');
  }

  const attestationPromise = attestClaim(requestForAttestation);
  attestationPromise.catch((error) => logger.error(error));

  setSession({ ...session, attestationPromise });

  return attestationPromise;
}

export async function getAttestationMessage(
  session: Session,
  logger: Logger,
): Promise<IEncryptedMessage> {
  const attestation = session.attestationPromise
    ? await session.attestationPromise
    : await startAttestation(session, logger);

  return encryptMessageBody(session.encryptionKeyId, {
    content: { attestation },
    type: MessageBodyType.SUBMIT_ATTESTATION,
  });
}
