import ky from 'ky';

import { getSession } from './utilities/session';
import { paths } from '../backend/endpoints/paths';

async function main() {
  const key = window.location.href.split('/').pop();

  const session = await getSession();
  const did = session.identity;

  const { email, blockHash, message } = await ky
    .post(paths.attestEmail, { json: { key, did }, timeout: 60 * 1000 })
    .json();

  const htmlToInsert = `
    <p class="confirmation">
      Your email credential for <strong>${email}</strong> has been attested via the KILT Blockchain in block
    </p>
    <p class="block">${blockHash}</p>`;

  document
    .getElementById('left')
    ?.insertAdjacentHTML('afterbegin', htmlToInsert);

  async function handleSave(event: Event) {
    event.preventDefault();

    await session.send(message);
  }

  document.getElementById('save')?.addEventListener?.('click', handleSave);
}

// Give the extention time to inject itself
setTimeout(main, 1000);
