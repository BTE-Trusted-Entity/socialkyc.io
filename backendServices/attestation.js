import { SendEmailCommand } from '@aws-sdk/client-ses';
import { Attestation, AttestedClaim, Identity, init } from '@kiltprotocol/core';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';

import { sesClient } from './sesClient.js';

async function sendEmail(recipientAddress, recipientName, key) {
  const params = {
    Destination: {
      ToAddresses: [recipientAddress],
    },
    Source: 'test@socialkyc.io',
    Message: {
      Subject: {
        Charset: 'UTF-8',
        Data: 'SocialKYC - Confirm your email address',
      },
      Body: {
        Text: {
          Charset: 'UTF-8',
          Data: `Hello ${recipientName},\n\nThis is a test. Please click the link to confirm your email: ${process.env.URL}/confirmation?key=${key} \n\nKind regards,\nSocialKYC`,
        },
      },
    },
  };
  try {
    await sesClient.send(new SendEmailCommand(params));
  } catch (err) {
    console.log('Error sending email: ', err.stack);
  }
}

export function processRequest(key, request) {
  const { contents } = request.claim;

  const email = contents['Email'];
  const name = contents['Full name'];

  sendEmail(email, name, key);
}

export async function attestClaim(request) {
  await init({ address: 'wss://kilt-peregrine-stg.kilt.io' });

  const demoIdentity = Identity.buildFromMnemonic(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );
  const demoPublicIdentity = demoIdentity.getPublicIdentity();

  const attestation = Attestation.fromRequestAndPublicIdentity(
    request,
    demoPublicIdentity,
  );

  const tx = await attestation.store();

  await BlockchainUtils.signAndSubmitTx(tx, demoIdentity);

  const attestedClaim = AttestedClaim.fromRequestAndAttestation(
    request,
    attestation,
  );
  return attestedClaim.attestation;
}
