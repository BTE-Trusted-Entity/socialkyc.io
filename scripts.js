const form = document.getElementById('emailForm');
const addButton = document.querySelector('.add');
const submitButton = document.querySelector('.submit');

function handleClick(event) {
  const button = event.target;
  if (!button.classList.contains('expanded')) {
    button.classList.add('expanded');

    form.classList.remove('hide');
  } else {
    button.classList.remove('expanded');

    addButton.disabled = true;
    submitButton.disabled = true;

    form.classList.remove('active');
    form.classList.add('hide');
  }
}

function handleFocus() {
  if (form.classList.contains('active')) {
    return;
  }
  form.classList.add('active');

  addButton.disabled = false;
  submitButton.disabled = false;
}

function handleSubmit(event) {
  event.preventDefault();
  // TODO: API call to open popup
}

document.getElementById('expand').addEventListener('click', handleClick);

document.querySelectorAll('input').forEach((input) => {
  input.addEventListener('focus', handleFocus);
});

form.addEventListener('submit', handleSubmit);
