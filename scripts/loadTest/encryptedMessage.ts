import {
  Credential,
  Did,
  DidResourceUri,
  IRequestAttestation,
  KiltEncryptionKeypair,
  Message,
  PartialClaim,
} from '@kiltprotocol/sdk-js';

import { naclSeal } from '@polkadot/util-crypto';

export async function getEncryptedMessage(
  claim: PartialClaim & Required<Pick<PartialClaim, 'contents'>>,
  dAppEncryptionKeyUri: DidResourceUri,
  keyAgreementKeyUri: DidResourceUri,
  keyAgreement: KiltEncryptionKeypair,
) {
  const owner = Did.parse(keyAgreementKeyUri).did;
  const credential = Credential.fromClaim({ ...claim, owner });

  const requestForAttestationBody: IRequestAttestation = {
    content: { credential },
    type: 'request-attestation',
  };

  const message = Message.fromBody(
    requestForAttestationBody,
    owner,
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
