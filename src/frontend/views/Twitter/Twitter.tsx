import { useCallback, useState } from 'react';
import { Link, Switch, useLocation, Route } from 'react-router-dom';
import ky from 'ky';
import { IEncryptedMessage } from '@kiltprotocol/types';
import { StatusCodes } from 'http-status-codes';

import { getSession } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { paths } from '../../../backend/endpoints/paths';

import { Explainer } from '../../components/Explainer/Explainer';
import { Expandable } from '../../components/Expandable/Expandable';

import * as styles from './Twitter.module.css';

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

        await session.listen(async (message) => {
          const result = await ky.post(paths.requestAttestationTwitter, {
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

          const attestationData = (await ky
            .post(paths.attestTwitter, {
              json: { key, twitter, did: session.identity },
            })
            .json()) as AttestationData;

          console.log('Attestation data: ', attestationData);

          // TODO: https://kiltprotocol.atlassian.net/browse/SK-521
        });

        const json = {
          twitter: twitterHandle,
          did: session.identity,
        };

        const message = (await ky
          .post(paths.quoteTwitter, { json })
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

  return (
    <Expandable expanded={expanded} processing={processing}>
      {expanded && (
        <Explainer>
          After you type in your Twitter handle, please choose an identity in
          your wallet to associate with your Twitter credential. In order to
          verify your credential we will prompt you to Tweet from this account.
        </Explainer>
      )}

      <Switch>
        <Route path="/twitter">
          <Link to="/" className={styles.open}>
            Twitter
          </Link>
        </Route>
        <Route>
          <Link to="/twitter" className={styles.closed}>
            Twitter
          </Link>
        </Route>
      </Switch>

      <Route path="/twitter">
        <section>
          {!code && (
            <form className={styles.form} onSubmit={handleSubmit}>
              <label className={styles.formLabel}>
                Your Twitter handle
                <div className={styles.twitterInputContainer}>
                  <input
                    className={styles.twitterInput}
                    onInput={handleInput}
                    type="text"
                    name="twitterHandle"
                    required
                  />
                </div>
              </label>
              <p className={styles.subline}>
                Validity: one year ({expiryDate})
              </p>
              <button
                type="submit"
                className={styles.chooseIdentity}
                disabled={!twitterHandle}
              >
                Choose Sporran Identity
              </button>
            </form>
          )}
        </section>
      </Route>
    </Expandable>
  );
}
