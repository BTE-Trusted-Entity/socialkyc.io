import { init, send } from 'emailjs-com';
import {
  IRequestAttestationForClaim,
  IRequestForAttestation,
  ISubmitAttestationForClaim,
  ISubmitTerms,
  MessageBodyType,
} from '@kiltprotocol/types';
import {
  Attestation,
  AttestedClaim,
  Claim,
  Identity,
  Quote,
  RequestForAttestation,
} from '@kiltprotocol/core';
import { BlockchainUtils } from '@kiltprotocol/chain-helpers';
import Message from '@kiltprotocol/messaging';

import { getSession } from './utilities/session';
import { initKilt } from './utilities/initKilt';
import { email } from './CTypes/email';

init('user_KgYzc3rp725X2IdbNpeML');

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

async function sendEmail(parameters: { email: string; name: string }) {
  if (!overlay) {
    throw new Error('Elements missing');
  }

  overlay.hidden = false;

  // await send('default_service', 'test', parameters);

  // TODO: Extract URL to environment variable
  try {
    const response = await fetch('http://localhost:3000', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(parameters),
    });
    console.log('Response: ', response);
    const data = await response.json();
    console.log('Data: ', data);
  } catch (err) {
    console.error(err);
  }
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

    const { rootHash } = request;
    window.localStorage.setItem(rootHash, JSON.stringify(request));

    const { contents } = request.claim;
    const email = contents['Email'] as string;
    const name = contents['Full name'] as string;
    await sendEmail({ email, name });
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
    session.account.address,
  );

  const demoIdentity = Identity.buildFromMnemonic(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );
  const quoteContents = {
    attesterAddress: demoIdentity.address,
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
  const quote = Quote.fromQuoteDataAndIdentity(quoteContents, demoIdentity);

  const messageBody: ISubmitTerms = {
    content: {
      claim,
      quote,
      legitimations: [],
      cTypes: [email],
    },
    type: MessageBodyType.SUBMIT_TERMS,
  };
  const message = new Message(
    messageBody,
    demoIdentity.getPublicIdentity(),
    session.account,
  );

  await session.send(message);
}

async function handleSave(event: Event) {
  event.preventDefault();

  const rootHash = window.localStorage.key(0) as string;
  const requestJson = window.localStorage.getItem(rootHash) as string;
  window.localStorage.removeItem(rootHash);
  const request = JSON.parse(requestJson) as IRequestForAttestation;

  await initKilt();
  const demoIdentity = Identity.buildFromMnemonic(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );
  const demoPublicIdentity = demoIdentity.getPublicIdentity();

  const session = await getSession();

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

  const messageBody: ISubmitAttestationForClaim = {
    content: attestedClaim,
    type: MessageBodyType.SUBMIT_ATTESTATION_FOR_CLAIM,
  };
  const message = new Message(messageBody, demoPublicIdentity, session.account);
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

document.getElementById('save')?.addEventListener?.('click', handleSave);
