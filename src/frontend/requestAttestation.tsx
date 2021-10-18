import { useCallback, useState } from 'react';
import { render } from 'react-dom';
import {
  Link,
  MemoryRouter,
  Route,
  Switch,
  useLocation,
} from 'react-router-dom';
import cx from 'classnames';
import { StatusCodes } from 'http-status-codes';
import ky from 'ky';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { getSession } from './utilities/session';

function handleBeforeUnload(event: Event) {
  event.preventDefault();
  event.returnValue = false;
}

function App(): JSX.Element {
  const { pathname } = useLocation();

  const [nameInput, setNameInput] = useState('');
  const [emailInput, setEmailInput] = useState('');

  const handleNameInput = useCallback((event) => {
    setNameInput(event.target.value);
  }, []);

  const handleEmailInput = useCallback((event) => {
    setEmailInput(event.target.value);
  }, []);

  const [email, setEmail] = useState('');

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      window.addEventListener('beforeunload', handleBeforeUnload);
      try {
        const session = await getSession();
        await session.listen(async (message) => {
          const result = await ky.post('/request-attestation', {
            json: message,
          });

          window.removeEventListener('beforeunload', handleBeforeUnload);

          if (result.status === StatusCodes.ACCEPTED) {
            console.log('Terms rejected');
          }

          if (result.status !== StatusCodes.OK) {
            console.log('Not attested');
            return;
          }

          setEmail(await result.text());
        });

        const json = {
          name: nameInput,
          email: emailInput,
          did: session.identity,
        };

        const message = (await ky
          .post('/quote', { json })
          .json()) as IEncryptedMessage;

        await session.send(message);
      } catch {
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    },
    [nameInput, emailInput],
  );

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
        <section className="lists">
          <h2 className="subline ">Featured Credentials</h2>
          <ul className="mediaList">
            <li
              className={cx('expandableItem', {
                expanded: pathname === '/email',
              })}
            >
              <p className="itemLabel">
                <Switch>
                  <Route path="/email">
                    <Link
                      to="/"
                      type="button"
                      className="button accordion opened"
                    />
                  </Route>
                  <Route>
                    <Link
                      to="/email"
                      type="button"
                      className="button accordion closed"
                    />
                  </Route>
                </Switch>
                Email
              </p>
              <Route path="/email">
                {email ? (
                  <div className="success">
                    <p>
                      We’ve sent an email to <strong>{email}</strong>
                    </p>
                    <p>Please check your inbox!</p>
                    <Link to="/" type="button" className="button buttonPrimary">
                      OK
                    </Link>
                  </div>
                ) : (
                  <form className="emailForm" onSubmit={handleSubmit}>
                    <label className="formLabel">
                      Your full name
                      <input
                        className="formInput"
                        onInput={handleNameInput}
                        type="text"
                        name="name"
                        required
                      />
                    </label>

                    <label className="formLabel">
                      Your email address
                      <input
                        className="formInput"
                        onInput={handleEmailInput}
                        type="email"
                        name="email"
                        required
                      />
                    </label>

                    <button
                      type="submit"
                      className="button buttonPrimary"
                      disabled={!nameInput || !emailInput}
                    >
                      Choose Sporran Identity
                    </button>
                  </form>
                )}
              </Route>
            </li>
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
