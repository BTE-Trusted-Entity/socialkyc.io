import { Attestation, AttestedClaim } from '@kiltprotocol/core';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';
import {
  IEncryptedMessage,
  IRequestForAttestation,
  ISubmitAttestationForClaim,
  MessageBodyType,
} from '@kiltprotocol/types';
import Message from '@kiltprotocol/messaging';
import {
  Request,
  ResponseObject,
  ResponseToolkit,
  ServerRoute,
} from '@hapi/hapi';
import Boom from '@hapi/boom';
import { z } from 'zod';

import { getRequestForAttestation } from '../utilities/requestCache';
import { fullDidPromise } from '../utilities/fullDid';
import { keypairsPromise } from '../utilities/keypairs';
import { assertionKeystore } from '../utilities/keystores';
import { configuration } from '../utilities/configuration';
import { encryptMessage } from '../utilities/encryptMessage';

interface AttestationData {
  email: string;
  blockHash: string;
  message: IEncryptedMessage;
}

async function attestClaim(
  requestForAttestation: IRequestForAttestation,
): Promise<AttestationData> {
  const attestation = Attestation.fromRequestAndDid(
    requestForAttestation,
    configuration.did,
  );

  const tx = await attestation.store();

  const { fullDid } = await fullDidPromise;
  const extrinsic = await fullDid.authorizeExtrinsic(tx, assertionKeystore);

  const keypairs = await keypairsPromise;
  const result = await BlockchainUtils.signAndSubmitTx(
    extrinsic,
    keypairs.identity,
    {
      resolveOn: BlockchainUtils.IS_FINALIZED,
      reSign: true,
    },
  );

  const attestedClaim = AttestedClaim.fromRequestAndAttestation(
    requestForAttestation,
    attestation,
  );

  const messageBody: ISubmitAttestationForClaim = {
    content: { attestation: attestedClaim.attestation },
    type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
  };

  const receiver = requestForAttestation.claim.owner;
  const message = new Message(messageBody, configuration.did, receiver);
  const encrypted = await encryptMessage(message, receiver);

  return {
    email: requestForAttestation.claim.contents['Email'] as string,
    blockHash: result.status.asFinalized.toString(),
    message: encrypted,
  };
}

const zodPayload = z.object({
  key: z.string(),
});

type Payload = z.infer<typeof zodPayload>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { key } = request.payload as Payload;

  let requestForAttestation: IRequestForAttestation;
  try {
    requestForAttestation = getRequestForAttestation(key);
  } catch {
    throw Boom.notFound(`Key not found: ${key}`);
  }

  try {
    const response = await attestClaim(requestForAttestation);
    return h.response(response);
  } catch (error) {
    throw Boom.internal('Attestation failed', error);
  }
}

export const attestation: ServerRoute = {
  method: 'POST',
  path: '/attest',
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
