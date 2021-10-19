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

  const isSupportedBrowser =
    browser && (browser.name === 'chrome' || browser.name === 'firefox');

  return (
    <div className="leftContainer">
      <h1 className="heading">Your IDENTITY is yours!</h1>
      <div className="scrollContainer">
        <section className="info">
          <p className="subline">
            Create your decentralized social credentials here. Your personal
            data is distributed on the KILT blockchain and only YOU have the key
            to it.
          </p>
          <p className="subline">
            socialKYC will not store, share or sell any of your data.
            <br />
            We forget about you as soon as we’ve verified your identity. Your
            data is all yours!
          </p>
        </section>
        {hasSporran ? (
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
        ) : isSupportedBrowser ? (
          <section className="install">
            <p className="warning">
              Please make sure to have a wallet extension installed for your
              browser. We recommend the SPORRAN extension that you can download
              and install here:
            </p>
            {browser.name === 'chrome' ? (
              <a
                className="button webstore chrome"
                href="https://chrome.google.com/webstore/detail/djdnajgjcbjhhbdblkegbcgodlkkfhcl"
              />
            ) : (
              <a
                className=" button webstore firefox"
                href="https://addons.mozilla.org/firefox/addon/sporran/"
              />
            )}
          </section>
        ) : (
          // TODO: Handle case of unsupported browser or mobile device
          <section></section>
        )}
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
