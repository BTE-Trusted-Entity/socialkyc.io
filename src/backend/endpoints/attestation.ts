import { Attestation, init, AttestedClaim } from '@kiltprotocol/core';
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
  await init({ address: 'wss://kilt-peregrine-stg.kilt.io' });

  const identityKeypair = getKeypairByBackupPhrase(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );

  const didKeypair = deriveDidAuthenticationKeypair(identityKeypair);

  const dAppDid = new LightDidDetails({ authenticationKey: didKeypair })['did'];

  const extensionDid = requestForAttestation.claim.owner;

  const attestation = Attestation.fromRequestAndDid(
    requestForAttestation,
    dAppDid,
  );

  const tx = await attestation.store();

  const result = await BlockchainUtils.signAndSubmitTx(tx, didKeypair, {
    resolveOn: BlockchainUtils.IS_FINALIZED,
  });

  const attestedClaim = AttestedClaim.fromRequestAndAttestation(
    requestForAttestation,
    attestation,
  );

  const messageBody: ISubmitAttestationForClaim = {
    content: { attestation: attestedClaim.attestation },
    type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
  };

  const message = new Message(messageBody, dAppDid, extensionDid);

  return {
    email: requestForAttestation.claim.contents['Email'] as string,
    blockHash: result.status.asInBlock.toString(),
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

  return h.response(await attestClaim(requestForAttestation));
}

export const attestation: ServerRoute = {
  method: 'POST',
  path: '/attest',
  handler,
};
