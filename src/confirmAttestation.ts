import ky from 'ky';

import { getSession } from './utilities/session';

async function main() {
  const key = window.location.href.split('/').pop();

  const { email, blockHash, message } = await ky
    .post('/attestation', { json: { key } })
    .json();

  const leftContainer = document.getElementById('left');

  const htmlToInsert = `<p class="confirmation">Your email credential for <strong>${email}</strong> has been attested via the KILT Blockchain in block</p><p class="block">${blockHash}</p>`;

  leftContainer?.insertAdjacentHTML('afterbegin', htmlToInsert);

  async function handleSave(event: Event) {
    event.preventDefault();

    const session = await getSession();

    await session.send(message);
  }

  document.getElementById('save')?.addEventListener?.('click', handleSave);
}

main();
