import { getSession } from './utilities/session';
import { requestCredential } from '../backend/verifier/requestCredentialApi';
import { verifyCredential } from '../backend/verifier/verifyApi';

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

function handleBeforeUnload(event: Event) {
  event.preventDefault();
  event.returnValue = false;
}

async function handleSubmit(event: Event) {
  event.preventDefault();

  window.addEventListener('beforeunload', handleBeforeUnload);

  const target = event.target as unknown as {
    elements: Record<string, HTMLInputElement>;
  };

  const cType = target.elements.ctype.value;

  try {
    const session = await getSession();
    const did = session.identity;

    await session.listen(async (message) => {
      try {
        const { credential, isAttested } = await verifyCredential(message);

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
      } finally {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    });
    const message = await requestCredential({ did, cType });

    await session.send(message);
  } catch {
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
}

credentialForm.addEventListener('submit', handleSubmit);
