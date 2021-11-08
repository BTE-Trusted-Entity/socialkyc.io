import {
  IDidDetails,
  IEncryptedMessage,
  IRequestForAttestation,
  MessageBodyType,
} from '@kiltprotocol/types';
import { Attestation, AttestedClaim } from '@kiltprotocol/core';

import { configuration } from './configuration';
import { signAndSubmit } from './signAndSubmit';
import { encryptMessageBody } from './encryptMessage';

export async function attestClaim(
  requestForAttestation: IRequestForAttestation,
  claimerDid: IDidDetails['did'],
): Promise<IEncryptedMessage> {
  const attestation = Attestation.fromRequestAndDid(
    requestForAttestation,
    configuration.did,
  );

  const tx = await attestation.store();
  await signAndSubmit(tx);

  const attestedClaim = AttestedClaim.fromRequestAndAttestation(
    requestForAttestation,
    attestation,
  );

  return encryptMessageBody(claimerDid, {
    content: { attestation: attestedClaim.attestation },
    type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
  });
}
