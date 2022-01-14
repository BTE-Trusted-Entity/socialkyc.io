import Boom from '@hapi/boom';
import {
  IEncryptedMessage,
  IRequestForAttestation,
  MessageBodyType,
} from '@kiltprotocol/types';
import { Attestation } from '@kiltprotocol/core';

import { configuration } from './configuration';
import { signAndSubmit } from './signAndSubmit';
import { encryptMessageBody } from './encryptMessage';
import {
  getSession,
  getSessionWithDid,
  Session,
  setSession,
} from './sessionStorage';

export async function attestClaim(
  requestForAttestation: IRequestForAttestation,
): Promise<Attestation> {
  const attestation = Attestation.fromRequestAndDid(
    requestForAttestation,
    configuration.did,
  );

  const tx = await attestation.store();
  await signAndSubmit(tx);

  return attestation;
}

export function startAttestation(session: Session): void {
  const { requestForAttestation, confirmed } = getSessionWithDid(session);
  if (!requestForAttestation || !confirmed) {
    throw Boom.notFound('Confirmed requestForAttestation not found');
  }

  const attestationPromise = attestClaim(requestForAttestation);
  setSession({ ...session, attestationPromise });
}

export async function getAttestationMessage(
  session: Session,
): Promise<IEncryptedMessage> {
  if (session.attestationPromise) {
    const attestation = await session.attestationPromise;

    // for email attestions we need to encrypt the migrated session data with the current session encryption key
    return encryptMessageBody(session.encryptionKeyId, {
      content: { attestation },
      type: MessageBodyType.SUBMIT_ATTESTATION,
    });
  }

  startAttestation(session);
  const { sessionId } = session;
  const sessionWithAttestationPromise = getSession({ sessionId });
  const { attestationPromise } = sessionWithAttestationPromise;
  const attestation = await attestationPromise;

  return encryptMessageBody(session.encryptionKeyId, {
    content: { attestation },
    type: MessageBodyType.SUBMIT_ATTESTATION,
  });
}
