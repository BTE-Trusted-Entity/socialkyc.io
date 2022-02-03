import { render } from 'react-dom';
import { generatePath, matchPath, MemoryRouter } from 'react-router-dom';

import { paths } from '../../paths';

import { Attester } from './Attester';

function getConfirmation(message: string, callback: (ok: boolean) => void) {
  const allowTransition = window.confirm(message);
  callback(allowTransition);
}

function getInitialEntry() {
  const email = matchPath<{ secret: string }>(window.location.pathname, {
    path: paths.window.email,
  });
  const discord = matchPath(window.location.pathname, {
    path: paths.window.discord,
  });

  if (email) {
    const { secret } = email.params;

    window.history.replaceState(null, '', '/');
    return generatePath(paths.emailConfirmation, {
      secret,
    });
  }

  if (discord) {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const secret = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      // TODO: Show special interface?
      return '/';
    }

    window.history.replaceState(null, '', '/');
    return generatePath(paths.discordAuth, {
      code,
      secret,
    });
  }

  return '/';
}

function renderAttester() {
  render(
    <MemoryRouter
      initialEntries={[getInitialEntry()]}
      getUserConfirmation={getConfirmation}
    >
      <Attester />
    </MemoryRouter>,
    document.querySelector('.leftContainer'),
  );
}

renderAttester();
