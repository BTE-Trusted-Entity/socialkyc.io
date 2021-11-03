import { useCallback, useState, useEffect, Fragment } from 'react';
import { Prompt, useRouteMatch } from 'react-router-dom';
import ky from 'ky';
import { StatusCodes } from 'http-status-codes';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { getSession } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { expiryDate } from '../../utilities/expiryDate';

import { Expandable } from '../../components/Expandable/Expandable';
import { Explainer } from '../../components/Explainer/Explainer';

import { paths } from '../../../backend/endpoints/paths';

import * as styles from './Email.module.css';

interface AttestationData {
  message: IEncryptedMessage;
}

function useAttestEmail(key: string) {
  const [data, setData] = useState<AttestationData>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!key) {
      return;
    }
    (async () => {
      try {
        const session = await getSession();
        const did = session.identity;

        const result = (await ky
          .post(paths.attestEmail, { json: { key, did }, timeout: 60 * 1000 })
          .json()) as AttestationData;
        setData(result);
      } catch (error) {
        console.error(error);
        setError(true);
      }
    })();
  }, [key]);
  return { data, error };
}

type AttestationStatus = 'requested' | 'attesting' | 'ready' | 'error';

export function Email(): JSX.Element {
  const [emailInput, setEmailInput] = useState('');

  const handleInput = useCallback((event) => {
    setEmailInput(event.target.value);
  }, []);

  const [email, setEmail] = useState('');

  const [processing, setProcessing] = useState(false);
  usePreventNavigation(processing);

  const key = (useRouteMatch('/email/:key')?.params as { key?: string }).key;

  const initialStatus = key ? 'attesting' : undefined;

  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  usePreventNavigation(status === 'attesting');

  const showSpinner = status === 'requested' || status === 'attesting';
  const showReady = status === 'ready';

  const { data, error } = useAttestEmail(key);
  useEffect(() => {
    if (error) {
      setStatus('error');
    } else if (data) {
      setStatus('ready');
    }
  }, [data, error]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProcessing(true);

      try {
        const session = await getSession();

        await session.listen(async (message) => {
          const result = await ky.post(paths.requestAttestationEmail, {
            json: message,
          });

          if (result.status === StatusCodes.ACCEPTED) {
            console.log('Terms rejected');
          }

          if (result.status !== StatusCodes.OK) {
            console.log('Not attested');
            return;
          }

          setEmail(await result.text());
          setStatus('requested');
        });

        const json = {
          email: emailInput,
          did: session.identity,
        };

        const message = (await ky
          .post(paths.quoteEmail, { json })
          .json()) as IEncryptedMessage;

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
      } finally {
        setProcessing(false);
      }
    },
    [emailInput],
  );

  const handleBackup = useCallback(async () => {
    try {
      const session = await getSession();
      await session.send(data.message);
    } catch (error) {
      console.error(error);
    }
  }, [data]);

  return (
    <Expandable path="/email" label="Email" processing={processing}>
      <Prompt
        when={status === 'attesting' || processing}
        message="The email attestation process has already started. Are you sure you want to leave?"
      />

      <Explainer>
        After you type in your email address, please choose an Identity in your
        wallet to associate with your email credential.
        <br /> In order to verify your credential we will send you an email with
        a verification link.
      </Explainer>

      {!status && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.formLabel}>
            Your email address
            <input
              className={styles.formInput}
              onInput={handleInput}
              type="email"
              name="email"
              required
            />
          </label>

          <p className={styles.expiry}>Validity: one year ({expiryDate})</p>

          <button
            type="submit"
            className={styles.chooseIdentity}
            disabled={!emailInput}
          >
            Choose Sporran Identity
          </button>
        </form>
      )}

      {status && (
        <div className={styles.statusContainer}>
          {showSpinner && <div className={styles.spinner} />}
          {showReady && <div className={styles.ready} />}

          <h2 className={styles.heading}>Attestation process:</h2>
          {status === 'requested' && (
            <Fragment>
              <p className={styles.status}>Email verification</p>
              <p className={styles.subline}>
                Email sent to {email}. Please check your inbox and click the
                link.
              </p>
            </Fragment>
          )}

          {status === 'attesting' && (
            <Fragment>
              <p className={styles.status}>In progress</p>
              <p className={styles.subline}>
                You have confirmed your email address.
              </p>
            </Fragment>
          )}

          {status === 'ready' && (
            <Fragment>
              <p className={styles.status}>Credential is ready</p>
              <p className={styles.subline}>
                We recommend backing up your credential now.
              </p>
            </Fragment>
          )}

          {/* TODO: Interface for error */}
          {status === 'error' && <p>Oops, there was an error.</p>}
        </div>
      )}
      {status === 'ready' && (
        <button className={styles.backup} type="button" onClick={handleBackup}>
          Back up credential
        </button>
      )}
    </Expandable>
  );
}
