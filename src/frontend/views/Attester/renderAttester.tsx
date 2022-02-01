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
  if (window.location.pathname.includes('email/confirmation')) {
    const secret = window.location.href.split('/').pop() as string;
    initialEntry = paths.emailConfirmation.replace(':secret', secret);
    window.history.replaceState(null, '', '/');
  } else if (window.location.pathname.includes('discord/auth')) {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const secret = searchParams.get('state');
    const error = searchParams.get('error');
    if (error) {
      // TODO: Show special interface?
      initialEntry = '/';
    } else {
      initialEntry = paths.discordAuth
        .replace(':code', code)
        .replace(':secret', secret);
    }
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
