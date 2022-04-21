import { requestCredential } from '../backend/verifier/requestCredentialApi';
import { verifyCredential } from '../backend/verifier/verifyApi';

import { apiWindow, getSession } from './utilities/session';

const credentialForm = document.getElementById(
  'credentialForm',
) as HTMLFormElement;
const shared = document.getElementById('shared') as HTMLElement;

const claimerDid = document.getElementById('claimer-did') as HTMLOutputElement;
const attesterDid = document.getElementById(
  'attester-did',
) as HTMLOutputElement;
const cType = document.getElementById('cType') as HTMLOutputElement;
const status = document.getElementById('status') as HTMLOutputElement;
const json = document.getElementById('json') as HTMLPreElement;
const values = document.getElementById('values') as HTMLPreElement;

const cTypes: Record<string, string> = {
  '0x3291bb126e33b4862d421bfaa1d2f272e6cdfc4f96658988fbcffea8914bd9ac': 'Email',
  '0x47d04c42bdf7fdd3fc5a194bcaa367b2f4766a6b16ae3df628927656d818f420':
    'Twitter',
  '0xd8c61a235204cb9e3c6acb1898d78880488846a7247d325b833243b46d923abe':
    'Discord',
  '0xad52bd7a8bd8a52e03181a99d2743e00d0a5e96fdc0182626655fcf0c0a776d0':
    'GitHub',
  '0x568ec5ffd7771c4677a5470771adcdea1ea4d6b566f060dc419ff133a0089d80':
    'Twitch',
  '0xcef8f3fe5aa7379faea95327942fd77287e1c144e3f53243e55705f11e890a4c':
    'Telegram',
};

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

  const requestedCType = target.elements.ctype.value;

  try {
    const session = await getSession(apiWindow.kilt.sporran);
    const { sessionId } = session;

    await session.listen(async (message) => {
      try {
        const { credential, isAttested } = await verifyCredential({
          message,
          sessionId,
        });

        cType.textContent =
          cTypes[credential.attestation.cTypeHash] || 'Unknown';

        const entries = Object.entries(credential.request.claim.contents);
        if (entries.length > 0) {
          values.textContent = '';
          entries.forEach(([label, value]) => {
            values.appendChild(document.createElement('dt')).textContent =
              label;
            values.appendChild(document.createElement('dd')).textContent =
              value as string;
          });
        } else {
          values.textContent = 'Not disclosed';
        }

        attesterDid.textContent = [
          'did:kilt:4pehddkhEanexVTTzWAtrrfo2R7xPnePpuiJLC7shQU894aY', // peregrine
          'did:kilt:4pnfkRn5UurBJTW92d9TaVLR2CqJdY4z5HPjrEbpGyBykare', // spiritnet
        ].includes(credential.attestation.owner)
          ? 'SocialKYC ✅'
          : 'Unknown';

        claimerDid.textContent = `✅ ${credential.request.claim.owner}`;
        claimerDid.title = credential.request.claim.owner;

        if (credential.attestation.revoked) {
          status.textContent = 'Revoked ❌';
        } else if (isAttested) {
          status.textContent = 'Attested ✅';
        } else {
          status.textContent = 'Not Attested ❓';
        }

        json.textContent = JSON.stringify(credential, null, 4);

        shared.hidden = false;
      } finally {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    });
    const message = await requestCredential({
      sessionId,
      cType: requestedCType,
    });

    await session.send(message);
  } catch (error) {
    console.error(error);
    window.removeEventListener('beforeunload', handleBeforeUnload);
  }
}

credentialForm.addEventListener('submit', handleSubmit);
