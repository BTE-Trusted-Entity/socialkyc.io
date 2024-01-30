import type {
  DidUrl,
  KiltEncryptionKeypair,
  PartialClaim,
} from '@kiltprotocol/types';
import type { IRequestAttestation } from '@kiltprotocol/extension-api/types';

import { parse } from '@kiltprotocol/did';
import * as Message from '@kiltprotocol/extension-api/messaging';
import { Credential as LegacyCredential } from '@kiltprotocol/legacy-credentials';
import { Crypto } from '@kiltprotocol/utils';

export async function getEncryptedMessage(
  claim: PartialClaim & Required<Pick<PartialClaim, 'contents'>>,
  receiverEncryptionKeyUri: DidUrl,
  senderEncryptionKeyUri: DidUrl,
  senderKeypair: KiltEncryptionKeypair,
) {
  const sender = parse(senderEncryptionKeyUri).did;
  const credential = LegacyCredential.fromClaim({ ...claim, owner: sender });

  const requestForAttestationBody: IRequestAttestation = {
    content: { credential },
    type: 'request-attestation',
  };

  const message = Message.fromBody(
    requestForAttestationBody,
    sender,
    parse(receiverEncryptionKeyUri).did,
  );

  return Message.encrypt(
    message,
    async function encrypt({ data, peerPublicKey }) {
      const { secretKey } = senderKeypair;
      const { nonce, box } = Crypto.encryptAsymmetric(
        data,
        peerPublicKey,
        secretKey,
      );
      return { nonce, data: box, keyUri: senderEncryptionKeyUri };
    },
    receiverEncryptionKeyUri,
  );
}
