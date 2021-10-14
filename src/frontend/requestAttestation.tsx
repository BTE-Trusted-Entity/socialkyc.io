import { useCallback, useState } from 'react';
import { render } from 'react-dom';
import {
  Link,
  MemoryRouter,
  Route,
  Switch,
  useHistory,
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
  const history = useHistory();

  const [focused, setFocused] = useState(false);
  const handleFocus = useCallback(() => setFocused(true), []);

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

          history.push('/email/overlay');
        });

        const target = event.target as unknown as {
          elements: Record<string, HTMLInputElement>;
        };
        const json = {
          name: target.elements?.name?.value,
          email: target.elements?.email?.value,
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
    [history],
  );

  return (
    <div>
      <h1 className="heading">Your IDENTITY is yours!</h1>
      <h2 className="info">Create your social credentials here.</h2>
      <p className="subline">(You can select more than one)</p>

      <ul className="media-list">
        <li className="expandableItem">
          <div className="label">
            <Switch>
              <Route path="/email">
                <Link to="/" type="button" className="button expand expanded" />
              </Route>
              <Route>
                <Link to="/email" type="button" className="button expand" />
              </Route>
            </Switch>
            Email Address
          </div>

          <Route path="/email">
            <form
              className={cx('emailForm inactive', { active: focused })}
              onSubmit={handleSubmit}
              onFocus={handleFocus}
            >
              <ol className="credentials">
                <li className="credential">
                  <input
                    type="text"
                    name="name"
                    placeholder="Your full name"
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    required
                  />
                </li>
              </ol>

              <button
                type="button"
                className="button add"
                aria-label="Add credential"
                disabled={!focused}
              />

              <footer>
                <button
                  type="submit"
                  className="button submit"
                  disabled={!focused}
                >
                  Request Attestation
                </button>
              </footer>
            </form>
          </Route>
        </li>
      </ul>

      <Route path="/email/overlay">
        <div className="overlay">
          <h2 className="overlayHeading">Attestation</h2>
          <div className="alert">
            <h3>Email credential attestation request</h3>
            <div className="main">
              <h2>Email sent</h2>
              {email && (
                <p>
                  We’ve sent an email to <strong>{email}</strong>
                </p>
              )}
              <p>Please check your inbox!</p>
              <Link to="/" type="button" className="button close">
                OK
              </Link>
            </div>
          </div>
        </div>
      </Route>
    </div>
  );
}

render(
  <MemoryRouter>
    <App />
  </MemoryRouter>,
  document.querySelector('.left'),
);
