import { Identity, init } from '@kiltprotocol/core';
import {
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

// Peregrine chain does not support the old Kilt Identities.
// Attestations can only be done with DIDs on this chain.
// Fake attestation data necessary until code is refactored to use DIDs.

interface AttestationData {
  email: string;
  blockHash: string;
  message: Message;
}

async function attestClaim(
  requestForAttestation: IRequestForAttestation,
): Promise<AttestationData> {
  await init({ address: 'wss://kilt-peregrine-stg.kilt.io' });

  // TODO: Replace Identities with DIDs
  const demoDAppIdentity = Identity.buildFromMnemonic(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );
  const demoDAppPublicIdentity = demoDAppIdentity.getPublicIdentity();

  const demoExtensionIdentity = Identity.buildFromMnemonic(
    'dawn comic glove crumble merge proof angle wife pull oyster type vapor',
  );
  const demoExtensionPublicIdentity = demoExtensionIdentity.getPublicIdentity();

  // const attestation = Attestation.fromRequestAndPublicIdentity(
  //   request,
  //   demoPublicIdentity,
  // );

  // const tx = await attestation.store();

  // await BlockchainUtils.signAndSubmitTx(tx, demoIdentity);

  // const attestedClaim = AttestedClaim.fromRequestAndAttestation(
  //   request,
  //   attestation,
  // );

  const fakeAttestation = {
    claimHash: requestForAttestation.rootHash,
    cTypeHash: requestForAttestation.claim.cTypeHash,
    owner: requestForAttestation.claim.owner,
    delegationId: null,
    revoked: false,
  };

  const fakeBlockHash =
    '0x1470baed4259acb180540ddb7a499cbf234cf120834169c8cb997462ea346909';

  const messageBody: ISubmitAttestationForClaim = {
    content: { attestation: fakeAttestation },
    type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
  };

  const message = new Message(
    messageBody,
    demoDAppPublicIdentity,
    demoExtensionPublicIdentity,
  );

  return {
    email: requestForAttestation.claim.contents['Email'] as string,
    blockHash: fakeBlockHash,
    message,
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

  return h.response(await attestClaim(requestForAttestation));
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
