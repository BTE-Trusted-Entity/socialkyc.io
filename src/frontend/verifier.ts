import { StatusCodes } from 'http-status-codes';
import ky from 'ky';
import { IAttestedClaim, IEncryptedMessage } from '@kiltprotocol/types';

import { getSession } from './utilities/session';

const credentialForm = document.getElementById(
  'credentialForm',
) as HTMLFormElement;
const shared = document.getElementById('shared') as HTMLElement;

const claimerDid = document.getElementById('claimer-did') as HTMLOutputElement;
const attesterDid = document.getElementById(
  'attester-did',
) as HTMLOutputElement;
const ctypeHash = document.getElementById('ctypeHash') as HTMLOutputElement;
const status = document.getElementById('status') as HTMLOutputElement;
const json = document.getElementById('json') as HTMLPreElement;

async function handleSubmit(event: Event) {
  event.preventDefault();

  const target = event.target as unknown as {
    elements: Record<string, HTMLInputElement>;
  };

  const ctype = target.elements.ctype.value;

  const session = await getSession();
  const did = session.identity;

  await session.listen(async (message) => {
    const result = await ky.post('/verify', { json: message });

    if (result.status !== StatusCodes.OK) {
      console.log('Credential verification failed');
      return;
    }

    const { credential, isAttested } = (await result.json()) as {
      credential: IAttestedClaim;
      isAttested: boolean;
    };

    claimerDid.textContent = credential.request.claim.owner;
    attesterDid.textContent = credential.attestation.owner;
    ctypeHash.textContent = credential.attestation.cTypeHash;

    if (credential.attestation.revoked) {
      status.textContent = 'Revoked';
    } else if (isAttested) {
      status.textContent = 'Attested';
    } else {
      status.textContent = 'Not Attested';
    }

    json.textContent = JSON.stringify(credential, null, 4);

    shared.hidden = false;
  });

  const message = (await ky
    .post('/request-credential', { json: { did, ctype } })
    .json()) as IEncryptedMessage;

  await session.send(message);
}

credentialForm.addEventListener('submit', handleSubmit);
