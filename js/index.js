const emailJSUserId = 'user_KgYzc3rp725X2IdbNpeML';

const form = document.getElementById('emailForm');
const addButton = document.getElementById('add');
const submitButton = document.getElementById('submit');
const expandButton = document.getElementById('expand');
const overlay = document.getElementById('overlay');

emailjs.init(emailJSUserId);

function handleExpand() {
  expandButton.classList.toggle('expanded');
  form.hidden = !expandButton.classList.contains('expanded');
}

function handleFocus() {
  form.classList.add('active');

  addButton.disabled = false;
  submitButton.disabled = false;
}

async function sendEmail() {
  overlay.hidden = false;

  try {
    await emailjs.send('default_service', 'test');
  } catch (err) {
    console.error(err);
  }
}

function handleSubmit(event) {
  event.preventDefault();

  window.sporranExtension.showClaimPopup(
    {
      'Full Name': event.target.elements.name.value,
      Email: event.target.elements.email.value,
    },
    sendEmail
  );
}

function handleClose() {
  handleExpand();
  overlay.hidden = true;
}

expandButton.addEventListener('click', handleExpand);

form.addEventListener('focusin', handleFocus);

form.addEventListener('submit', handleSubmit);

document.getElementById('close').addEventListener('click', handleClose);
