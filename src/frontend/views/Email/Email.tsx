import { Fragment, useCallback, useEffect, useState } from 'react';
import { Prompt, useRouteMatch } from 'react-router-dom';

import { Session } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { expiryDate } from '../../utilities/expiryDate';

import { Expandable } from '../../components/Expandable/Expandable';
import { Explainer } from '../../components/Explainer/Explainer';

import { useAttestEmail } from '../../../backend/email/attestationEmailApi';
import { quoteEmail } from '../../../backend/email/quoteEmailApi';
import { requestAttestationEmail } from '../../../backend/email/sendEmailApi';

import * as styles from './Email.module.css';

type AttestationStatus = 'requested' | 'attesting' | 'ready' | 'error';

interface Props {
  session: Session;
}

export function Email({ session }: Props): JSX.Element {
  const [emailInput, setEmailInput] = useState('');

  const handleInput = useCallback((event) => {
    setEmailInput(event.target.value);
  }, []);

  const [email, setEmail] = useState('');

  const [processing, setProcessing] = useState(false);
  usePreventNavigation(processing);

  const secret = (
    useRouteMatch('/email/:secret')?.params as { secret?: string }
  )?.secret;

  // TODO: only set to attesting after confirming with backend that this is a valid secret
  const initialStatus = secret ? 'attesting' : undefined;

  const [status, setStatus] = useState<AttestationStatus | undefined>(
    initialStatus,
  );
  usePreventNavigation(status === 'attesting');

  const showSpinner = status === 'requested' || status === 'attesting';
  const showReady = status === 'ready';

  const { data, error } = useAttestEmail(secret, session.sessionId);
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
        const { sessionId } = session;

        await session.listen(async (message) => {
          setEmail(await requestAttestationEmail({ sessionId, message }));
          setStatus('requested');
        });

        const message = await quoteEmail({
          email: emailInput,
          sessionId,
        });

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
      } finally {
        setProcessing(false);
      }
    },
    [emailInput, session],
  );

  const handleBackup = useCallback(async () => {
    try {
      if (!data) {
        throw new Error('No attestation data');
      }
      await session.send(data);
    } catch (error) {
      console.error(error);
    }
  }, [data, session]);

  return (
    // TODO: label changes depending on attestatio status
    <Expandable path="/email" label="Email Address" processing={processing}>
      <Prompt
        when={status === 'attesting' || processing}
        message="The email attestation process has already started. Are you sure you want to leave?"
      />

      <Explainer>
        After entering your email address, please choose an Identity in your
        wallet to associate with your email credential. We will email you a link
        so that we can attest your credential.
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
            Continue in wallet
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
              <p className={styles.status}>Email sent</p>
              <p className={styles.subline}>
                Email sent to {email}. Please check your inbox and spam folder
                and click the link.
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
                We recommend that you back up your credential now.
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
