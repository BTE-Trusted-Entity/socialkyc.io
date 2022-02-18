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
  const github = matchPath(window.location.pathname, {
    path: paths.window.github,
  });

  if (email) {
    const { secret } = email.params;

    window.history.replaceState(null, '', '/');
    return generatePath(paths.emailConfirmation, {
      secret,
    });
  }

  if (discord || github) {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const secret = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code || !secret) {
      // TODO: Show special interface?
      return '/';
    }

    const path = discord ? paths.discordAuth : paths.githubAuth;

    window.history.replaceState(null, '', '/');
    return generatePath(path, {
      code,
      secret,
    });
  }

  return '/';
}

function renderAttester() {
  const container = document.querySelector('.leftContainer');
  if (!container) {
    return;
  }

  render(
    <MemoryRouter
      initialEntries={[getInitialEntry()]}
      getUserConfirmation={getConfirmation}
    >
      <Attester />
    </MemoryRouter>,
    container,
  );
}

renderAttester();
