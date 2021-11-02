import { Attestation, AttestedClaim } from '@kiltprotocol/core';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';
import {
  IDidDetails,
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
import { tweetsListeners } from '../utilities/tweets';
import { paths } from './paths';

interface AttestationData {
  twitter: string;
  blockHash: string;
  message: IEncryptedMessage;
}

async function attestClaim(
  requestForAttestation: IRequestForAttestation,
  claimerDid: IDidDetails['did'],
): Promise<AttestationData> {
  const attestation = Attestation.fromRequestAndDid(
    requestForAttestation,
    configuration.did,
  );

  const tx = await attestation.store();

  const { fullDid } = await fullDidPromise;
  const { identity } = await keypairsPromise;
  const extrinsic = await fullDid.authorizeExtrinsic(
    tx,
    assertionKeystore,
    identity.address,
  );

  const result = await BlockchainUtils.signAndSubmitTx(extrinsic, identity, {
    resolveOn: BlockchainUtils.IS_FINALIZED,
    reSign: true,
  });

  const attestedClaim = AttestedClaim.fromRequestAndAttestation(
    requestForAttestation,
    attestation,
  );

  const messageBody: ISubmitAttestationForClaim = {
    content: { attestation: attestedClaim.attestation },
    type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
  };

  const message = new Message(messageBody, configuration.did, claimerDid);
  const encrypted = await encryptMessage(message, claimerDid);

  return {
    twitter: requestForAttestation.claim.contents['Twitter'] as string,
    blockHash: result.status.asFinalized.toString(),
    message: encrypted,
  };
}

const zodPayload = z.object({
  key: z.string(),
  twitter: z.string(),
  did: z.string(),
});

type Payload = z.infer<typeof zodPayload>;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter attestation started');

  const { key, twitter, did } = request.payload as Payload;

  let requestForAttestation: IRequestForAttestation;
  try {
    requestForAttestation = getRequestForAttestation(key);
    logger.debug('Twitter attestation found request');
  } catch {
    throw Boom.notFound(`Key not found: ${key}`);
  }

  if (!tweetsListeners[twitter]) {
    throw Boom.notFound(`Twitter handle not found: ${twitter}`);
  }

  try {
    logger.debug('Twitter attestation waiting for tweet');
    const confirmation = tweetsListeners[twitter][1];
    await confirmation.promise;

    logger.debug('Twitter attestation attesting');
    const response = await attestClaim(requestForAttestation, did);

    logger.debug('Twitter attestation completed');
    return h.response(response);
  } catch (error) {
    throw Boom.internal('Attestation failed', error);
  }
}

export const attestationTwitter: ServerRoute = {
  method: 'POST',
  path: paths.attestTwitter,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
