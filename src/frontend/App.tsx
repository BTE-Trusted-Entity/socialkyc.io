import { useEffect, useState, useCallback } from 'react';
import { render } from 'react-dom';
import {
  Link,
  MemoryRouter,
  Route,
  Switch,
  useLocation,
} from 'react-router-dom';
import cx from 'classnames';
import { detect } from 'detect-browser';

import { apiWindow, getSession } from './utilities/session';
import {
  addUnloadListener,
  removeUnloadListener,
} from './utilities/unloadListener';

import { Email } from './Email';

interface HasSporran {
  data?: {
    hasSporran: boolean;
  };
}

function useHasSporran(): HasSporran {
  const [hasSporran, setHasSporran] = useState<boolean | null>(null);

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (Boolean(apiWindow.kilt.sporran)) {
        setHasSporran(true);
      }
    }, 100);

    const timeoutId = setTimeout(() => {
      if (hasSporran === null) {
        setHasSporran(false);
      }
    }, 500);

    return () => {
      clearInterval(intervalId);
      clearInterval(timeoutId);
    };
  }, [hasSporran]);

  return typeof hasSporran === 'boolean' ? { data: { hasSporran } } : {};
}

function usePreventNavigation(active: boolean) {
  useEffect(() => {
    if (active) {
      addUnloadListener();
    } else {
      removeUnloadListener();
    }
  }, [active]);
}

function App(): JSX.Element {
  const { pathname } = useLocation();

  const browser = detect();

  const isDesktop =
    browser && browser.os !== 'iOS' && browser.os !== 'Android OS';

  const isSupportedBrowser =
    isDesktop && (browser.name === 'chrome' || browser.name === 'firefox');

  const isUnsupportedBrowser =
    isDesktop && browser.name !== 'chrome' && browser.name !== 'firefox';

  const { data } = useHasSporran();
  const hasSporran = data?.hasSporran;

  const showWebstoreLink = hasSporran === false && isSupportedBrowser;
  const showWebsiteLink = hasSporran === false && isUnsupportedBrowser;

  const [authorized, setAuthorized] = useState(false);

  const [processing, setProcessing] = useState(false);

  usePreventNavigation(processing);

  const handleConnectClick = useCallback(async (event) => {
    event.preventDefault();
    setProcessing(true);

    try {
      await getSession();
      setAuthorized(true);
    } catch (error) {
      console.error(error);
    } finally {
      setProcessing(false);
    }
  }, []);

  return (
    <div className="leftContainer">
      <h1 className="heading">Your IDENTITY, back in your hands!</h1>
      <div className="scrollContainer">
        <section className="info">
          <p className="subline">
            Create your decentralized social credentials here. Your personal
            data will be anchored on the KILT blockchain and only you will
            decide who can access it.
          </p>
          <p className="subline">
            SocialKYC does not store, share or sell any of your data.
            <br />
            The service forgets about you after verifying your identity.
          </p>
        </section>

        {!data && <div className="spinner"></div>}

        {hasSporran && !authorized && (
          <section className="connectContainer">
            <div className={cx('connect', { processing })}>
              <p className="subline">Please authorize access to your wallet</p>
              <button
                type="button"
                className="button buttonPrimary"
                onClick={handleConnectClick}
                disabled={processing}
              >
                Connect to wallet
              </button>
            </div>
            {processing && <div className="spinner"></div>}
          </section>
        )}

        {hasSporran && authorized && (
          <section className="lists">
            <h2 className="subline ">Featured Credentials</h2>
            <ul className="mediaList">
              <Email />
              <li
                className={cx('expandableItem', {
                  expanded: pathname === '/twitter',
                })}
              >
                <p className="itemLabel">
                  <Switch>
                    <Route path="/twitter">
                      <Link
                        to="/"
                        type="button"
                        className="button accordion opened"
                      />
                    </Route>
                    <Route>
                      <Link
                        to=""
                        type="button"
                        className="button accordion closed"
                      />
                    </Route>
                  </Switch>
                  Twitter
                </p>
              </li>
            </ul>
          </section>
        )}

        {showWebstoreLink && (
          <section className="install">
            <p className="warning">
              Please make sure to have a wallet extension installed for your
              browser. We recommend the Sporran extension that you can download
              and install here:
            </p>
            {browser.name === 'chrome' && (
              <a
                className="button webstore chrome"
                href="https://chrome.google.com/webstore/detail/djdnajgjcbjhhbdblkegbcgodlkkfhcl"
              />
            )}
            {browser.name === 'firefox' && (
              <a
                className=" button webstore firefox"
                href="https://addons.mozilla.org/firefox/addon/sporran/"
              />
            )}
          </section>
        )}

        {showWebsiteLink && (
          <section className="install ">
            <p className="warning">
              Please make sure to have a wallet extension installed for your
              browser. We recommend the
              <br />
              <a className="textLink" href="https://www.sporran.org/">
                Sporran extension.
              </a>
            </p>
          </section>
        )}

        {/* TODO: Handle case of mobile device */}
      </div>
    </div>
  );
}

render(
  <MemoryRouter>
    <App />
  </MemoryRouter>,
  document.querySelector('.left'),
);
