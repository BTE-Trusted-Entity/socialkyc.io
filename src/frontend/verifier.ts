import { StatusCodes } from 'http-status-codes';
import ky from 'ky';
import { IMessage } from '@kiltprotocol/types';

import { getSession } from './utilities/session';

const form = document.getElementById('subscription-form') as HTMLFormElement;
const success = document.getElementById('subscribed') as HTMLDivElement;
const signUp = document.getElementById('kyc') as HTMLButtonElement;

function handleSuccess() {
  form.hidden = true;
  success.hidden = false;
}

async function handleClick() {
  const session = await getSession();

  await session.listen(async (message) => {
    const result = await ky.post('/verify', { json: message });

    if (result.status !== StatusCodes.OK) {
      console.log('Not attested');
      return;
    }

    const verifiedClaims = await result.json();
    console.log(verifiedClaims);

    handleSuccess();
  });

  const message = (await ky
    .post('/request-claims', {
      json: {
        did: session.account,
      },
    })
    .json()) as IMessage;

  await session.send(message);
}

signUp.addEventListener('click', handleClick);
