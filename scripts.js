const form = document.getElementById('emailForm');
const addButton = document.querySelector('.add');
const submitButton = document.querySelector('.submit');

function handleClick(event) {
  const button = event.target;

  button.classList.toggle('expanded');
  form.hidden = !button.classList.contains('expanded');
}

function handleFocus() {
  form.classList.add('active');

  addButton.disabled = false;
  submitButton.disabled = false;
}

function handleSubmit(event) {
  event.preventDefault();

  window.sporranExtension.showClaimPopup({
    'Full Name': event.target.elements.name.value,
    Email: event.target.elements.email.value,
  });
}

document.getElementById('expand').addEventListener('click', handleClick);

form.addEventListener('focusin', handleFocus);

form.addEventListener('submit', handleSubmit);
