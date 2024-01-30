import type { IAttestation, ICredential } from '@kiltprotocol/types';
import type { IEncryptedMessage } from '@kiltprotocol/extension-api/types';

import * as Boom from '@hapi/boom';
import { Logger } from 'pino';
import { ConfigService } from '@kiltprotocol/sdk-js';

import { Attestation } from '@kiltprotocol/credentials';

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
  requestForAttestation: ICredential,
): Promise<IAttestation> {
  if (configuration.did === 'pending') {
    throw new Error('Own DID not found');
  }

  const attestation = Attestation.fromCredentialAndDid(
    requestForAttestation,
    configuration.did,
  );
  const { claimHash, cTypeHash } = attestation;

  const api = ConfigService.get('api');

  const alreadyAttested = (await api.query.attestation.attestations(claimHash))
    .isSome;
  if (alreadyAttested) {
    // We see some attestations extrinsic failing as already attested, check for it early
    return attestation;
  }

  const endTimer = attestDurationSeconds.startTimer();

  try {
    await batchSignAndSubmitAttestation(attestation);
  } catch (exception) {
    // It happens that despite the error the attestation has gone through, do not fail then
    const attested = (await api.query.attestation.attestations(claimHash))
      .isSome;
    if (!attested) {
      attestFail.labels({ credential_type: cTypeHash }).inc();
      throw exception;
    }
  } finally {
    endTimer();
  }

  attestSuccess.labels({ credential_type: cTypeHash }).inc();

  return attestation;
}

export async function startAttestation(
  session: BasicSession,
  logger: Logger,
): Promise<IAttestation> {
  const { credential, confirmed } = session;
  if (!credential || !confirmed) {
    throw Boom.notFound('Confirmed requestForAttestation not found');
  }

  const attestationPromise = attestClaim(credential);
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
    type: 'submit-attestation',
  });
}
