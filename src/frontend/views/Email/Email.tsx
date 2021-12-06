import { Fragment, useCallback, useEffect, useState } from 'react';
import { Prompt, useRouteMatch } from 'react-router-dom';
import cx from 'classnames';

import { Session } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { expiryDate } from '../../utilities/expiryDate';

import { LinkBack } from '../../components/LinkBack/LinkBack';
import { Spinner } from '../../components/Spinner/Spinner';
import { Explainer } from '../../components/Explainer/Explainer';
import { AttestationProcess } from '../../components/AttestationProcess/AttestationProcess';

import { useAttestEmail } from '../../../backend/email/attestationEmailApi';
import { quoteEmail } from '../../../backend/email/quoteEmailApi';
import { requestAttestationEmail } from '../../../backend/email/sendEmailApi';
import { paths } from '../../paths';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
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
    useRouteMatch(paths.emailConfirmation)?.params as { secret?: string }
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
    <section
      className={cx(flowStyles.container, {
        [flowStyles.processing]: processing,
      })}
    >
      {processing && <Spinner />}

      <h1 className={styles.heading}>Email Address Attestation</h1>

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
        <form onSubmit={handleSubmit}>
          <label>
            Your email address
            <input
              className={styles.formInput}
              onInput={handleInput}
              type="email"
              name="email"
              required
              maxLength={100}
            />
          </label>

          <p>Validity: one year ({expiryDate})</p>

          <button
            type="submit"
            className={flowStyles.ctaButton}
            disabled={!emailInput}
          >
            Continue in wallet
          </button>
        </form>
      )}

      {status === 'requested' && (
        <AttestationProcess
          spinner={showSpinner}
          ready={showReady}
          status="Email sent"
          subline={`Email sent to ${email}. Please check your inbox and spam folder and click the link.`}
        />
      )}

      {status === 'attesting' && (
        <AttestationProcess
          spinner={showSpinner}
          ready={showReady}
          status="Anchoring credential on KILT blockchain"
          subline="Please leave this tab open until your credential is attested."
        />
      )}

      {status === 'ready' && (
        <Fragment>
          <AttestationProcess
            spinner={showSpinner}
            ready={showReady}
            status="Credential is ready"
            subline="We recommend that you back up your credential now."
          />

          <button
            className={flowStyles.ctaButton}
            type="button"
            onClick={handleBackup}
          >
            Back up credential
          </button>
        </Fragment>
      )}

      {status === 'error' && (
        <AttestationProcess
          spinner={showSpinner}
          ready={showReady}
          error="Oops, there was an error."
        />
      )}

      <LinkBack />
    </section>
  );
}
