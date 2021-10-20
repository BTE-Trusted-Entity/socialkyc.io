import { useEffect, useState } from 'react';
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

import { apiWindow } from './utilities/session';

import { Email } from './Email';

function App(): JSX.Element {
  const { pathname } = useLocation();

  const [hasSporran, setHasSporran] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      if (Boolean(apiWindow.kilt.sporran)) {
        setHasSporran(true);
      }
      clearInterval(id);
    }, 100);
    return () => clearInterval(id);
  }, []);

  const browser = detect();

  const isDesktop =
    browser && browser.os !== 'iOS' && browser.os !== 'Android OS';

  const isSupportedBrowser =
    isDesktop && (browser.name === 'chrome' || browser.name === 'firefox');

  const isUnsupportedBrowser =
    isDesktop && browser.name !== 'chrome' && browser.name !== 'firefox';

  const showWebstoreLink = !hasSporran && isSupportedBrowser;
  const showWebsiteLink = !hasSporran && isUnsupportedBrowser;

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

        {hasSporran && (
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
                Sporran extension
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
