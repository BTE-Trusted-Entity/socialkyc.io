import { useCallback, useState } from 'react';
import { Route, Switch, useLocation } from 'react-router';
import { Link } from 'react-router-dom';
import cx from 'classnames';
import ky from 'ky';
import { StatusCodes } from 'http-status-codes';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { getSession } from './utilities/session';
import { handleBeforeUnload } from './utilities/handleBeforeUnload';

export function Email(): JSX.Element {
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

        console.log('Message: ', message);

        await session.send(message);
      } catch (error) {
        console.error(error);
        window.removeEventListener('beforeunload', handleBeforeUnload);
      }
    },
    [nameInput, emailInput],
  );

  return (
    <li
      className={cx('expandableItem', {
        expanded: pathname === '/email',
      })}
    >
      <p className="itemLabel">
        <Switch>
          <Route path="/email">
            <Link to="/" type="button" className="button accordion opened" />
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
              className="button buttonPrimary chooseIdentity"
              disabled={!nameInput || !emailInput}
            >
              Choose Sporran Identity
            </button>
          </form>
        )}
      </Route>
    </li>
  );
}
