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

export interface AttestationData {
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

  // TODO: Remove when we get SDK upgrade which includes this call in authorizeExtrinsic
  await fullDid.refreshTxIndex();

  const extrinsic = await fullDid.authorizeExtrinsic(
    tx,
    assertionKeystore,
    identity.address,
  );

  await BlockchainUtils.signAndSubmitTx(extrinsic, identity, {
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

  return { message: encrypted };
}

export const twitterAttestationPromises: Record<
  string,
  Promise<AttestationData>
> = {};

const zodPayload = z.object({
  key: z.string(),
  did: z.string(),
});

export type Input = z.infer<typeof zodPayload>;

export type Output = undefined;

async function handler(
  request: Request,
  h: ResponseToolkit,
): Promise<ResponseObject> {
  const { logger } = request;
  logger.debug('Twitter confirmation started');

  const { key, did } = request.payload as Input;

  let requestForAttestation: IRequestForAttestation;
  try {
    requestForAttestation = getRequestForAttestation(key);
    logger.debug('Twitter confirmation found request');
  } catch {
    throw Boom.notFound(`Key not found: ${key}`);
  }

  const twitter = requestForAttestation.claim.contents['Twitter'] as string;
  if (!tweetsListeners[twitter]) {
    throw Boom.notFound(`Twitter handle not found: ${twitter}`);
  }

  try {
    logger.debug('Twitter confirmation waiting for tweet');
    const confirmation = tweetsListeners[twitter][1];
    await confirmation.promise;
    delete tweetsListeners[twitter];

    logger.debug('Twitter confirmation attesting');
    twitterAttestationPromises[key] = attestClaim(requestForAttestation, did);

    return h.response(<Output>undefined);
  } catch (error) {
    throw Boom.internal('Confirmation failed', error);
  }
}

export const confirmTwitter: ServerRoute = {
  method: 'POST',
  path: paths.confirmTwitter,
  handler,
  options: {
    validate: {
      payload: async (payload) => zodPayload.parse(payload),
    },
  },
};
