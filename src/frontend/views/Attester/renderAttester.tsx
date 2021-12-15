import { render } from 'react-dom';
import { MemoryRouter } from 'react-router-dom';

import { paths } from '../../paths';
import { Attester } from './Attester';

function getConfirmation(message: string, callback: (ok: boolean) => void) {
  const allowTransition = window.confirm(message);
  callback(allowTransition);
}

function renderAttester() {
  let initialEntry: string;
  if (window.location.pathname.includes('confirmation')) {
    const secret = window.location.href.split('/').pop() as string;
    initialEntry = paths.emailConfirmation.replace(':secret', secret);
    window.history.replaceState(null, '', '/');
  } else {
    initialEntry = '/';
  }

  render(
    <MemoryRouter
      initialEntries={[initialEntry]}
      getUserConfirmation={getConfirmation}
    >
      <Attester />
    </MemoryRouter>,
    document.querySelector('.leftContainer'),
  );
}

renderAttester();
