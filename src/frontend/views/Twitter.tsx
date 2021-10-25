import {
  useCallback,
  useRef,
  useState,
  useEffect,
  MutableRefObject,
} from 'react';
import { Switch, useLocation, Route } from 'react-router';
import { Link } from 'react-router-dom';
import cx from 'classnames';
import ky from 'ky';
import { IEncryptedMessage } from '@kiltprotocol/types';
import { StatusCodes } from 'http-status-codes';

import { getSession } from './utilities/session';
import { usePreventNavigation } from './utilities/usePreventNavigation';

interface RequestAttestationData {
  key: string;
  code: string;
  twitter: string;
}

interface AttestationData {
  twitter: string;
  blockHash: string;
  message: IEncryptedMessage;
}

const expiryDate = new Date(
  new Date().setFullYear(new Date().getFullYear() + 1),
).toLocaleDateString();

function useHandleOutsideClick(
  ref: MutableRefObject<HTMLElement>,
  showRef: (value: React.SetStateAction<boolean>) => void,
): void {
  useEffect(() => {
    function handleOutsideClick(event) {
      if (ref.current && !ref.current.contains(event.target)) {
        showRef(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [ref, showRef]);
}

export function Twitter(): JSX.Element {
  const { pathname } = useLocation();
  const expanded = pathname === '/twitter';

  const [twitterHandle, setTwitterHandle] = useState('');

  const handleInput = useCallback((event) => {
    setTwitterHandle(event.target.value);
  }, []);

  const [processing, setProcessing] = useState(false);
  usePreventNavigation(processing);

  const [code, setCode] = useState('');

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProcessing(true);

      try {
        const session = await getSession();

        //TODO: listen
        await session.listen(async (message) => {
          const result = await ky.post('/request-attestation-twitter', {
            json: message,
          });

          if (result.status === StatusCodes.ACCEPTED) {
            console.log('Terms rejected');
          }

          if (result.status !== StatusCodes.OK) {
            console.log('Not attested');
            return;
          }

          const { key, code, twitter } =
            (await result.json()) as RequestAttestationData;
          setCode(code);

          const json = { key, twitter, did: session.identity };
          const attestationData = (await ky
            .post('./attest-twitter', { json })
            .json()) as AttestationData;

          console.log('Attestation data: ', attestationData);
        });

        const json = {
          twitter: twitterHandle,
          did: session.identity,
        };

        const message = (await ky
          .post('/quote-twitter', { json })
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

  const handleToggleExplainer = useCallback(() => {
    setShowExplainer(!showExplainer);
  }, [showExplainer]);

  const explainerRef = useRef();
  useHandleOutsideClick(explainerRef, setShowExplainer);

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
          {!code && (
            <form className="form" onSubmit={handleSubmit}>
              <label className="formLabel">
                Your Twitter handle
                <div className="formInput twitterInputContainer">
                  <input
                    className="twitterInput"
                    onInput={handleInput}
                    type="text"
                    name="twitterHandle"
                    required
                  />
                </div>
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
          )}
        </section>
      </Route>
      {expanded && (
        <div className="explainerContainer" ref={explainerRef}>
          <button
            className="button showExplainer"
            onClick={handleToggleExplainer}
          ></button>
          {showExplainer && (
            <p className="explainer">
              After you typed in your Twitter handle, please choose an identity
              in your wallet to associate with your Twitter credential. In order
              to verify your credential we will prompt you to Tweet from this
              account.
            </p>
          )}
        </div>
      )}
    </li>
  );
}
