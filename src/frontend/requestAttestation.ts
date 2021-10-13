import { StatusCodes } from 'http-status-codes';
import ky from 'ky';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { getSession } from './utilities/session';

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

function handleBeforeUnload(event: Event) {
  event.preventDefault();
  event.returnValue = false;
}

async function handleSubmit(event: Event) {
  event.preventDefault();
  window.addEventListener('beforeunload', handleBeforeUnload);
  try {
    const session = await getSession();
    await session.listen(async (message) => {
      const result = await ky.post('/request-attestation', { json: message });

      window.removeEventListener('beforeunload', handleBeforeUnload);

      if (result.status === StatusCodes.ACCEPTED) {
        console.log('Terms rejected');
      }

      if (result.status !== StatusCodes.OK) {
        console.log('Not attested');
        return;
      }

      const email = await result.text();
      document
        .getElementById('sent')
        ?.insertAdjacentHTML(
          'afterend',
          `<p>We've sent an email to <strong>${email}</strong></p>`,
        );

      if (overlay) {
        overlay.hidden = false;
      }
    });

    const target = event.target as unknown as {
      elements: Record<string, HTMLInputElement>;
    };
    const json = {
      name: target.elements?.name?.value,
      email: target.elements?.email?.value,
      did: session.identity,
    };

    const message = (await ky
      .post('/quote', { json })
      .json()) as IEncryptedMessage;

    await session.send(message);
  } catch {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
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
