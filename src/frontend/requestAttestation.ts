import {
  IRequestAttestationForClaim,
  IRequestForAttestation,
  ISubmitTerms,
  MessageBodyType,
} from '@kiltprotocol/types';
import { Claim, Quote, RequestForAttestation } from '@kiltprotocol/core';
import { LightDidDetails } from '@kiltprotocol/did';
import Message from '@kiltprotocol/messaging';
import ky from 'ky';

import { getSession } from './utilities/session';
import { initKilt } from './utilities/initKilt';
import {
  deriveDidAuthenticationKeypair,
  getKeypairByBackupPhrase,
} from './utilities/did';
import { email } from './CTypes/email';

const form = document.getElementById('emailForm') as HTMLFormElement;
const addButton = document.getElementById('add') as HTMLButtonElement;
const submitButton = document.getElementById('submit') as HTMLButtonElement;
const expandButton = document.getElementById('expand') as HTMLButtonElement;
const overlay = document.getElementById('overlay');

function handleExpand() {
  if (!form || !expandButton) {
    throw new Error('Elements missing');
  }

  expandButton.classList.toggle('expanded');
  form.hidden = !expandButton.classList.contains('expanded');
}

function handleFocus() {
  if (!form || !addButton || !submitButton) {
    throw new Error('Elements missing');
  }

  form.classList.add('active');

  addButton.disabled = false;
  submitButton.disabled = false;
}

async function requestAttestation(request: IRequestForAttestation) {
  if (!overlay) {
    throw new Error('Elements missing');
  }

  document
    .getElementById('sent')
    ?.insertAdjacentHTML(
      'afterend',
      `<p>We've sent an email to <strong>${request.claim.contents['Email']}</strong></p>`,
    );

  overlay.hidden = false;

  await ky.post('/request-attestation', { json: request });
}

async function handleSubmit(event: Event) {
  event.preventDefault();

  await initKilt();

  const session = await getSession();
  await session.listen(async (message) => {
    const { type } = message.body;
    if (type === MessageBodyType.REJECT_TERMS) {
      console.log('Terms rejected');
      return;
    }
    if (type !== MessageBodyType.REQUEST_ATTESTATION_FOR_CLAIM) {
      return;
    }

    const messageBody = message.body as IRequestAttestationForClaim;
    const request = messageBody.content.requestForAttestation;
    RequestForAttestation.verifyData(request);

    await requestAttestation(request);
  });

  const target = event.target as unknown as {
    elements: Record<string, HTMLInputElement>;
  };
  const claimContents = {
    'Full name': target.elements?.name?.value,
    Email: target.elements?.email?.value,
  };
  const claim = Claim.fromCTypeAndClaimContents(
    email,
    claimContents,
    session.account,
  );

  const identityKeypair = getKeypairByBackupPhrase(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );

  const didKeypair = deriveDidAuthenticationKeypair(identityKeypair);

  const didDetails = new LightDidDetails({ authenticationKey: didKeypair });

  const quoteContents = {
    attesterDid: didDetails['did'],
    cTypeHash: email.hash,
    cost: {
      gross: 233,
      net: 23.3,
      tax: { vat: 3.3 },
    },
    currency: 'KILT',
    timeframe: new Date('2021-07-10'),
    termsAndConditions: 'https://www.example.com/terms',
  };

  const quote = await Quote.fromQuoteDataAndIdentity(
    quoteContents,
    didDetails,
    {
      sign: async ({ data, alg }) => ({
        data: didKeypair.sign(data, { withType: false }),
        alg,
      }),
    },
  );

  const messageBody: ISubmitTerms = {
    content: {
      claim,
      quote,
      legitimations: [],
      cTypes: [email],
    },
    type: MessageBodyType.SUBMIT_TERMS,
  };

  const message = new Message(messageBody, didDetails['did'], session.account);

  await session.send(message);
}

function handleClose() {
  if (!overlay) {
    throw new Error('Elements missing');
  }

  handleExpand();
  overlay.hidden = true;
}

expandButton?.addEventListener?.('click', handleExpand);

form?.addEventListener?.('focusin', handleFocus);

form?.addEventListener?.('submit', handleSubmit);

document.getElementById('close')?.addEventListener?.('click', handleClose);
