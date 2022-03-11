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
  const twitch = matchPath(window.location.pathname, {
    path: paths.window.twitch,
  });

  if (email) {
    const { secret } = email.params;

    window.history.replaceState(null, '', '/');
    return generatePath(paths.emailConfirmation, {
      secret,
    });
  }

  if (discord || github || twitch) {
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const secret = searchParams.get('state');
    const error = searchParams.get('error');

    if (error || !code || !secret) {
      // TODO: Show special interface?
      return '/';
    }

    let path;

    if (discord) {
      path = paths.discordAuth;
    }
    if (github) {
      path = paths.githubAuth;
    }
    if (twitch) {
      path = paths.twitchAuth;
    }

    if (!path) {
      throw new Error('No matching path');
    }

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
