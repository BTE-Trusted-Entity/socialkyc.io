function handleClick(event) {
  const button = event.target;
  const form = document.querySelector('form');
  if (!button.classList.contains('expanded')) {
    button.classList.add('expanded');
    form.classList.remove('hide');
  } else {
    button.classList.remove('expanded');
    form.classList.add('hide');
  }
}

document.getElementById('expand').addEventListener('click', handleClick);
