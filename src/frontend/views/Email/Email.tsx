import { Fragment, useCallback, useEffect, useState } from 'react';
import { Prompt, useRouteMatch } from 'react-router-dom';
import cx from 'classnames';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { Session } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { expiryDate } from '../../utilities/expiryDate';
import { exceptionToError } from '../../utilities/exceptionToError';

import { LinkBack } from '../../components/LinkBack/LinkBack';
import { Spinner } from '../../components/Spinner/Spinner';
import { Explainer } from '../../components/Explainer/Explainer';
import { AttestationProcess } from '../../components/AttestationProcess/AttestationProcess';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { SlowAttestation } from '../../components/SlowAttestation/SlowAttestation';
import { TryAgain } from '../../components/TryAgain/TryAgain';

import { attestEmail } from '../../../backend/email/attestationEmailApi';
import { confirmEmail } from '../../../backend/email/confirmEmailApi';
import { quoteEmail } from '../../../backend/email/quoteEmailApi';
import { requestAttestationEmail } from '../../../backend/email/sendEmailApi';
import { paths } from '../../paths';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
import * as styles from './Email.module.css';

type AttestationStatus =
  | 'none'
  | 'requested'
  | 'confirming'
  | 'attesting'
  | 'ready'
  | 'error';

interface Props {
  session: Session;
}

export function Email({ session }: Props): JSX.Element {
  const [emailInput, setEmailInput] = useState('');
  const [inputError, setInputError] = useState<string>();

  const handleInput = useCallback((event) => {
    setEmailInput(event.target.value);
  }, []);

  const [email, setEmail] = useState('');

  const secret = (
    useRouteMatch(paths.emailConfirmation)?.params as { secret?: string }
  )?.secret;

  const initialStatus = secret ? 'confirming' : 'none';

  const [flowError, setFlowError] = useState<
    'closed' | 'expired' | 'unknown'
  >();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const preventNavigation =
    processing || ['confirming', 'attesting'].includes(status);
  usePreventNavigation(preventNavigation);

  const showSpinner = ['requested', 'confirming', 'attesting'].includes(status);
  const showReady = status === 'ready';

  const { sessionId } = session;
  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();
  useEffect(() => {
    if (!secret) {
      return;
    }
    (async () => {
      try {
        await confirmEmail({ secret, sessionId });
        setStatus('attesting');
      } catch {
        setStatus('error');
        setFlowError('expired');
        return;
      }
      try {
        setBackupMessage(await attestEmail({ sessionId }));
        setStatus('ready');
      } catch {
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [secret, sessionId]);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProcessing(true);
      setInputError(undefined);
      setFlowError(undefined);

      try {
        const { sessionId } = session;

        await session.listen(async (message) => {
          try {
            setEmail(await requestAttestationEmail({ sessionId, message }));
            setStatus('requested');
          } catch (exception) {
            const { message } = exceptionToError(exception);
            if (message.includes('closed') || message.includes('rejected')) {
              setFlowError('closed');
            } else if (message.includes('400')) {
              setInputError('Incorrect email format, please review.');
            } else {
              console.error(exception);
              setFlowError('unknown');
              setStatus('error');
            }
          }
        });

        const message = await quoteEmail({
          email: emailInput,
          sessionId,
        });

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [emailInput, session],
  );

  const handleBackup = useCallback(async () => {
    try {
      if (!backupMessage) {
        throw new Error('No backup message');
      }
      await session.send(backupMessage);
    } catch (exception) {
      const { message } = exceptionToError(exception);
      if (message.includes('closed')) {
        return; // don’t care that the user has closed the dialog
      }
      setFlowError('unknown');
      console.error(exception);
    }
  }, [backupMessage, session]);

  const handleTryAgainClick = useCallback(() => {
    setStatus('none');
    setFlowError(undefined);
  }, []);

  return (
    <section
      className={cx(flowStyles.container, {
        [flowStyles.processing]: processing,
      })}
    >
      {processing && <Spinner />}

      <h1 className={styles.heading}>Email Address Attestation</h1>

      <Prompt
        when={preventNavigation}
        message="The email attestation process has already started. Are you sure you want to leave?"
      />

      <Explainer>
        After entering your email address, please choose an Identity in your
        wallet to associate with your email credential. We will email you a link
        so that we can attest your credential.
      </Explainer>

      {status === 'none' && (
        <form onSubmit={handleSubmit}>
          <label>
            Your email address
            <input
              className={styles.formInput}
              onInput={handleInput}
              value={emailInput}
              type="email"
              name="email"
              required
              maxLength={100}
            />
          </label>

          <output className={styles.inputError} hidden={!inputError}>
            {inputError}
          </output>

          <p>Validity: one year ({expiryDate})</p>

          {flowError === 'closed' && (
            <DetailedMessage
              icon="exclamation"
              heading="Signing error:"
              message="Your wallet was closed before the request was signed."
              details="Click „Continue in Wallet“ to try again."
            />
          )}

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
        <Fragment>
          <AttestationProcess
            spinner={showSpinner}
            ready={showReady}
            status="Anchoring credential on KILT blockchain"
            subline="Please leave this tab open until your credential is attested."
          />
          <SlowAttestation />
        </Fragment>
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
            Show credential in wallet
          </button>
        </Fragment>
      )}

      {flowError === 'unknown' && (
        <DetailedMessage
          icon="exclamation"
          heading="Attestation error:"
          message="Something went wrong!"
          details="Click „Try Again“ button or reload the page or restart your browser."
        />
      )}

      {flowError === 'expired' && (
        <DetailedMessage
          icon="exclamation"
          heading="Attestation error:"
          message="This link has expired."
        />
      )}

      {(flowError === 'unknown' || flowError === 'expired') && (
        <TryAgain onClick={handleTryAgainClick} />
      )}

      <LinkBack />
    </section>
  );
}
