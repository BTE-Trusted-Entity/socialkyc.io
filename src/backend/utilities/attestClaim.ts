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
import { getSessionWithDid, Session, setSession } from './sessionStorage';

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

export async function startAttestation(session: Session): Promise<Attestation> {
  const { requestForAttestation, confirmed } = getSessionWithDid(session);
  if (!requestForAttestation || !confirmed) {
    throw Boom.notFound('Confirmed requestForAttestation not found');
  }

  const attestationPromise = attestClaim(requestForAttestation);
  setSession({ ...session, attestationPromise });

  return attestationPromise;
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

  const attestation = await startAttestation(session);

  return encryptMessageBody(session.encryptionKeyId, {
    content: { attestation },
    type: MessageBodyType.SUBMIT_ATTESTATION,
  });
}
