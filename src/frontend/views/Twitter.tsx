import { useCallback, useState } from 'react';
import { Switch, useLocation, Route } from 'react-router';
import { Link } from 'react-router-dom';
import cx from 'classnames';
import ky from 'ky';

import { getSession } from './utilities/session';
import { usePreventNavigation } from './utilities/usePreventNavigation';
import { IEncryptedMessage } from '@kiltprotocol/types';

const expiryDate = new Date(
  new Date().setFullYear(new Date().getFullYear() + 1),
).toLocaleDateString();

export function Twitter(): JSX.Element {
  const { pathname } = useLocation();
  const expanded = pathname === '/twitter';

  const [twitterHandle, setTwitterHandle] = useState('');

  const handleInput = useCallback((event) => {
    setTwitterHandle(event.target.value);
  }, []);

  const [processing, setProcessing] = useState(false);
  usePreventNavigation(processing);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProcessing(true);

      try {
        const session = await getSession();

        //TODO: listen

        const json = {
          twitter: twitterHandle,
          did: session.identity,
        };

        const message = (await ky
          .post('/quote', { json })
          .json()) as IEncryptedMessage;

        await session.send(message);
      } catch (error) {
        console.error(error);
      } finally {
        setProcessing(false);
      }
    },
    [twitterHandle],
  );

  const [showExplainer, setShowExplainer] = useState(false);

  const toggleExplainer = useCallback(() => {
    setShowExplainer(!showExplainer);
  }, [showExplainer]);

  return (
    <li className={cx('expandableItem', { expanded })}>
      <p className="itemLabel">
        <Switch>
          <Route path="/twitter">
            <Link to="/" type="button" className="button accordion opened" />
          </Route>
          <Route>
            <Link
              to="/twitter"
              type="button"
              className="button accordion closed"
            />
          </Route>
        </Switch>
        Twitter
      </p>
      <Route path="/twitter">
        <section>
          <form className="form" onSubmit={handleSubmit}>
            <label className="formLabel">
              Your Twitter handle
              <input
                className="formInput"
                onInput={handleInput}
                type="text"
                name="twitterHandle"
                defaultValue="@"
                required
              />
            </label>
            <p className="subline">Validity: one year ({expiryDate})</p>
            <button
              type="submit"
              className="button buttonPrimary chooseIdentity"
              disabled={!twitterHandle}
            >
              Choose Sporran Identity
            </button>
          </form>
        </section>
      </Route>
      {expanded && (
        <button
          className="button toggleExplainer"
          onClick={toggleExplainer}
        ></button>
      )}
    </li>
  );
}
