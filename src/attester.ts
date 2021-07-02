import { init, send } from 'emailjs-com';

const emailJSUserId = 'user_KgYzc3rp725X2IdbNpeML';

const form = document.getElementById('emailForm') as HTMLFormElement;
const addButton = document.getElementById('add') as HTMLButtonElement;
const submitButton = document.getElementById('submit') as HTMLButtonElement;
const expandButton = document.getElementById('expand') as HTMLButtonElement;
const overlay = document.getElementById('overlay');

init(emailJSUserId);

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

async function sendEmail() {
  if (!overlay) {
    throw new Error('Elements missing');
  }

  overlay.hidden = false;

  await send('default_service', 'test');
}

async function handleSubmit(event: Event) {
  event.preventDefault();

  const target = event.target as unknown as {
    elements: Record<string, HTMLInputElement>;
  };

  // TODO: remove ts-ignore when implementing Credentials API
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  await window.sporranExtension.showClaimPopup({
    'Full Name': target.elements?.name?.value,
    Email: target.elements?.email?.value,
  });
  await sendEmail();
}

function handleClose() {
  if (!overlay) {
    throw new Error('Elements missing');
  }

  handleExpand();
  overlay.hidden = true;
}

expandButton.addEventListener('click', handleExpand);

form.addEventListener('focusin', handleFocus);

form.addEventListener('submit', handleSubmit);

document.getElementById('close')?.addEventListener('click', handleClose);
