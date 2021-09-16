import { Attestation, AttestedClaim } from '@kiltprotocol/core';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';
import { LightDidDetails } from '@kiltprotocol/did';
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

import { getRequestForAttestation } from '../utilities/requestCache';
import { fullDidPromise } from '../utilities/fullDid';
import {
  deriveDidAuthenticationKeypair,
  getKeypairByBackupPhrase,
} from '../../frontend/utilities/did';

interface AttestationData {
  email: string;
  blockHash: string;
  message: Message;
}

async function attestClaim(
  requestForAttestation: IRequestForAttestation,
): Promise<AttestationData> {
  const identityKeypair = getKeypairByBackupPhrase(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );

  const extensionDid = requestForAttestation.claim.owner;

  const didKeypair = deriveDidAuthenticationKeypair(identityKeypair);

  const dAppDidDetails = new LightDidDetails({ authenticationKey: didKeypair });

  const attestation = Attestation.fromRequestAndDid(
    requestForAttestation,
    dAppDidDetails.did,
  );

  const tx = await attestation.store();

  const fullDid = await fullDidPromise;

  const extrinsic = await fullDid.authorizeExtrinsic(tx, {
    sign: async ({ data, alg }) => ({
      data: identityKeypair.derive('//did//assertion//0').sign(data, {
        withType: false,
      }),
      alg,
    }),
  });

  const result = await BlockchainUtils.signAndSubmitTx(
    extrinsic,
    identityKeypair,
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

  const message = new Message(messageBody, dAppDidDetails.did, extensionDid);

  return {
    email: requestForAttestation.claim.contents['Email'] as string,
    blockHash: result.status.asFinalized.toString(),
    message,
  };
}

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { key } = request.payload as { key: string };
  if (!key) {
    throw Boom.badRequest('No key provided');
  }

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
};
