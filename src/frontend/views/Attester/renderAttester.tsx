import { createRoot } from 'react-dom/client';
import { generatePath, matchPath, MemoryRouter } from 'react-router-dom';

import { paths } from '../../paths';

import { confirmSteam } from '../../../backend/steam/confirmSteamApi';

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
  const linkedIn = matchPath(window.location.pathname, {
    path: paths.window.linkedIn,
  });
  const steam = matchPath(window.location.pathname, {
    path: paths.window.steam,
  });

  if (email) {
    const { secret } = email.params;

    window.history.replaceState(null, '', '/');
    return generatePath(paths.emailConfirmation, {
      secret,
    });
  }

  if (steam) {
    const params = Object.fromEntries(
      new URLSearchParams(window.location.search),
    ) as {
      'openid.assoc_handle': string;
      'openid.claimed_id': string;
      'openid.identity': string;
      'openid.mode': string;
      'openid.ns': string;
      'openid.op_endpoint': string;
      'openid.response_nonce': string;
      'openid.return_to': string;
      'openid.sig': string;
      'openid.signed': string;
    };
    confirmSteam(params);
    // window.history.replaceState(null, '', '/');
    // return generatePath(paths.steam, params);
  }

  if (discord || github || twitch || linkedIn) {
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
    if (linkedIn) {
      path = paths.linkedInAuth;
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

  const root = createRoot(container);
  root.render(
    <MemoryRouter
      initialEntries={[getInitialEntry()]}
      getUserConfirmation={getConfirmation}
    >
      <Attester />
    </MemoryRouter>,
  );
}

renderAttester();
