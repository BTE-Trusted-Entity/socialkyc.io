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
  const attestation = session.attestationPromise ? await session.attestationPromise : await startAttestation(session);
  }

  const attestation = await startAttestation(session);

  return encryptMessageBody(session.encryptionKeyId, {
    content: { attestation },
    type: MessageBodyType.SUBMIT_ATTESTATION,
  });
}
