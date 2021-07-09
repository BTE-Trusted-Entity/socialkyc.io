import { getSession } from './utilities/session';
import { MessageBodyType } from '@kiltprotocol/types';
import { initKilt } from './utilities/initKilt';

const form = document.getElementById('subscription-form') as HTMLFormElement;
const success = document.getElementById('subscribed') as HTMLDivElement;
const signUp = document.getElementById('kyc') as HTMLButtonElement;

function handleSuccess() {
  form.hidden = true;
  success.hidden = false;
}

async function handleClick() {
  await initKilt();

  const session = await getSession();

  await session.listen(async (message) => {
    if (message.body.type !== MessageBodyType.SUBMIT_CLAIMS_FOR_CTYPES) {
      return;
    }
    handleSuccess();
  });
}

signUp.addEventListener('click', handleClick);
