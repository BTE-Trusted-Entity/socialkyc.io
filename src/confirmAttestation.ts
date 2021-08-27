import ky from 'ky';

import { getSession } from './utilities/session';

async function main() {
  const key = window.location.href.split('/').pop();

  const { email, blockHash, message } = await ky
    .post('/attestation', { json: { key } })
    .json();

  const emailElement = document.createElement('strong');
  emailElement.textContent = email;

  const textBeforeEmail = document.getElementById('textBeforeEmail');
  textBeforeEmail?.after(emailElement);

  const block = document.createElement('p');
  block.classList.add('block');
  block.textContent = blockHash;

  const confirmation = document.getElementById('confirmation');

  confirmation?.after(block);

  async function handleSave(event: Event) {
    event.preventDefault();

    const session = await getSession();

    await session.send(message);
  }

  document.getElementById('save')?.addEventListener?.('click', handleSave);
}

main();
