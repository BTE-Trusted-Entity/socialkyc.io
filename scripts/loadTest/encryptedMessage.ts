import {
  Credential,
  Did,
  DidResourceUri,
  IClaim,
  IRequestAttestation,
  KiltEncryptionKeypair,
  Message,
} from '@kiltprotocol/sdk-js';

import { naclSeal } from '@polkadot/util-crypto';

export async function getEncryptedMessage(
  claim: IClaim,
  dAppEncryptionKeyUri: DidResourceUri,
  keyAgreementKeyUri: DidResourceUri,
  keyAgreement: KiltEncryptionKeypair,
) {
  const credential = Credential.fromClaim(claim);

  const requestForAttestationBody: IRequestAttestation = {
    content: { credential },
    type: 'request-attestation',
  };

  const message = Message.fromBody(
    requestForAttestationBody,
    claim.owner,
    Did.parse(dAppEncryptionKeyUri).did,
  );

  return Message.encrypt(
    message,
    async function decrypt({ data, peerPublicKey }) {
      const { secretKey } = keyAgreement;
      const { sealed, nonce } = naclSeal(data, secretKey, peerPublicKey);
      return { nonce, data: sealed, keyUri: keyAgreementKeyUri };
    },
    dAppEncryptionKeyUri,
  );
}
