import Boom from '@hapi/boom';
import { Logger } from 'pino';
import {
  IEncryptedMessage,
  IRequestForAttestation,
  MessageBodyType,
} from '@kiltprotocol/types';
import { Attestation } from '@kiltprotocol/core';

import {
  attestSuccess,
  attestFail,
  attestDurationSeconds,
} from '../endpoints/metrics';

import { configuration } from './configuration';
import { batchSignAndSubmitAttestation } from './batchSignAndSubmitAttestation';
import { encryptMessageBody } from './encryptMessage';
import { BasicSession, Session, setSession } from './sessionStorage';

export async function attestClaim(
  requestForAttestation: IRequestForAttestation,
): Promise<Attestation> {
  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  const attestation = Attestation.fromRequestAndDid(
    requestForAttestation,
    configuration.did,
  );
  const { claimHash, cTypeHash } = attestation;

  const alreadyAttested = Boolean(await Attestation.query(claimHash));
  if (alreadyAttested) {
    // We see some attestations extrinsic failing as already attested, check for it early
    return attestation;
  }

  try {
    const end = attestDurationSeconds.startTimer();
    await batchSignAndSubmitAttestation(attestation);
    end();
    attestSuccess.labels({ credential_type: cTypeHash }).inc();
  } catch (exception) {
    // It happens that despite the error the attestation has gone through, do not fail then
    const attested = Boolean(await Attestation.query(claimHash));
    if (!attested) {
      attestFail.labels({ credential_type: cTypeHash }).inc();
      throw exception;
    }
    attestSuccess.labels({ credential_type: cTypeHash }).inc();
  }

  return attestation;
}

export async function startAttestation(
  session: BasicSession,
  logger: Logger,
): Promise<Attestation> {
  const { requestForAttestation, confirmed } = session;
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

  return encryptMessageBody(session.encryptionKeyUri, {
    content: { attestation },
    type: MessageBodyType.SUBMIT_ATTESTATION,
  });
}
