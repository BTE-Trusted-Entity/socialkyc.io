import { Fragment, useCallback, useRef, useState, useEffect } from 'react';
import { Prompt } from 'react-router-dom';
import { IEncryptedMessage } from '@kiltprotocol/types';
import cx from 'classnames';

import { Session } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { useCopyButton } from '../../components/useCopyButton/useCopyButton';
import { expiryDate } from '../../utilities/expiryDate';
import { exceptionToError } from '../../utilities/exceptionToError';

import { Explainer } from '../../components/Explainer/Explainer';
import { LinkBack } from '../../components/LinkBack/LinkBack';
import { Spinner } from '../../components/Spinner/Spinner';
import { AttestationProcess } from '../../components/AttestationProcess/AttestationProcess';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { SlowAttestation } from '../../components/SlowAttestation/SlowAttestation';
import { TryAgain } from '../../components/TryAgain/TryAgain';

import { confirmTwitter } from '../../../backend/twitter/confirmTwitterApi';
import { attestTwitter } from '../../../backend/twitter/attestationTwitterApi';
import { quoteTwitter } from '../../../backend/twitter/quoteTwitterApi';
import { requestAttestationTwitter } from '../../../backend/twitter/requestAttestationTwitterApi';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
import * as styles from './Twitter.module.css';

const confirmingTimeout = 5 * 60 * 1000;

type AttestationStatus =
  | 'none'
  | 'requested'
  | 'confirming'
  | 'unconfirmed'
  | 'attesting'
  | 'ready'
  | 'error';

interface Props {
  session: Session;
}

export function Twitter({ session }: Props): JSX.Element {
  const [twitterHandle, setTwitterHandle] = useState('');
  const [inputError, setInputError] = useState<string>();

  const handleInput = useCallback((event) => {
    setTwitterHandle(event.target.value);
    setInputError(undefined);
  }, []);

  const handleBlur = useCallback(() => {
    const trimmed = twitterHandle.trim();
    if (trimmed !== twitterHandle) {
      setTwitterHandle(trimmed);
    }
  }, [twitterHandle]);

  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<AttestationStatus>('none');
  const [flowError, setFlowError] = useState<'closed' | 'unknown'>();

  const [secret, setSecret] = useState('');

  const showSpinner = ['confirming', 'attesting'].includes(status);
  const showReady = status === 'ready';

  const preventNavigation = processing || showSpinner;
  usePreventNavigation(preventNavigation);

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const copy = useCopyButton(messageRef);

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  const handleSubmit = useCallback(
    async (event) => {
      try {
        event.preventDefault();
        setProcessing(true);
        setInputError(undefined);
        setFlowError(undefined);

        const unexpectedCharacter = twitterHandle.trim().match(/[^a-z0-9_]/i);
        if (unexpectedCharacter) {
          setInputError(
            `There is an unexpected character „${unexpectedCharacter[0]}“, please correct.`,
          );
          return;
        }

        const { sessionId } = session;

        await session.listen(async (message) => {
          try {
            const { secret } = await requestAttestationTwitter({
              sessionId,
              message,
            });
            setSecret(secret);
            setStatus('confirming');
            setProcessing(false);

            await confirmTwitter({ sessionId });
            setStatus('attesting');

            const attestationMessage = await attestTwitter({ sessionId });
            setBackupMessage(attestationMessage);

            setStatus('ready');
          } catch (exception) {
            const { message } = exceptionToError(exception);
            if (message.includes('closed') || message.includes('rejected')) {
              setFlowError('closed');
            } else {
              console.error(exception);
              setFlowError('unknown');
              setStatus('error');
            }
          }
        });

        const message = await quoteTwitter({
          username: twitterHandle,
          sessionId,
        });

        setStatus('requested');
        await session.send(message);
      } catch (error) {
        console.error(error);
        setFlowError('unknown');
        setStatus('error');
      } finally {
        setProcessing(false);
      }
    },
    [session, twitterHandle],
  );

  const handleBackup = useCallback(async () => {
    if (!backupMessage) {
      return;
    }
    try {
      await session.send(backupMessage);
    } catch (error) {
      console.error(error);
    }
  }, [backupMessage, session]);

  const handleTryAgainClick = useCallback(() => {
    setStatus('none');
    setFlowError(undefined);
    setSecret('');
  }, []);

  useEffect(() => {
    if (status !== 'confirming') {
      return;
    }
    const timeout = setTimeout(
      () => setStatus('unconfirmed'),
      confirmingTimeout,
    );
    return () => clearTimeout(timeout);
  }, [status]);

  return (
    <section
      className={cx(flowStyles.container, {
        [flowStyles.processing]: processing,
      })}
    >
      {processing && <Spinner />}

      <h1 className={styles.heading}>Twitter Account Attestation</h1>

      <Prompt
        when={preventNavigation}
        message="The Twitter attestation process has already started. Are you sure you want to leave?"
      />

      <Explainer>
        After entering your Twitter handle, please choose an identity in your
        wallet to associate with your Twitter credential. We will prompt you to
        Tweet so that we can attest your credential.
      </Explainer>
      <section>
        {(status === 'none' || status === 'requested') && (
          <form onSubmit={handleSubmit}>
            <label>
              Your Twitter handle
              <span
                className={styles.twitterInputContainer}
                data-invalid={inputError}
              >
                <input
                  className={styles.twitterInput}
                  onInput={handleInput}
                  onBlur={handleBlur}
                  value={twitterHandle}
                  type="text"
                  name="twitterHandle"
                  required
                  maxLength={100}
                />
              </span>
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
              disabled={!twitterHandle}
            >
              Continue in wallet
            </button>
          </form>
        )}

        {status === 'confirming' && (
          <Fragment>
            <AttestationProcess
              spinner={showSpinner}
              ready={showReady}
              status="Starting"
              subline="Your credential will be attested as soon as you Tweet the text below."
            />
            <div>
              <label htmlFor="tweet">Please tweet this message:</label>
              <p className={styles.tweetContainer}>
                <textarea
                  className={styles.tweetInput}
                  id="tweet"
                  ref={messageRef}
                  value={`I use SocialKYC to represent my internet identity. @social_kyc_tech ${secret}`}
                  readOnly
                />
                {copy.supported && (
                  <button
                    className={copy.className}
                    onClick={copy.handleCopyClick}
                    type="button"
                  >
                    {copy.title}
                  </button>
                )}
              </p>
              <p className={flowStyles.ctaLine}>
                <a
                  className={flowStyles.ctaLink}
                  href="https://twitter.com/"
                  target="_blank"
                  rel="noreferrer"
                >
                  Go to Twitter
                </a>
              </p>
            </div>
          </Fragment>
        )}

        {status === 'unconfirmed' && (
          <Fragment>
            <DetailedMessage
              icon="exclamation"
              heading="Attestation error:"
              message="Tweet not found"
              details="SocialKYC could not find your tweet. Please make sure you tweet the text exactly as provided. You can use the copy button to avoid any typos."
            />
            <TryAgain onClick={handleTryAgainClick} />
          </Fragment>
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
          <Fragment>
            <DetailedMessage
              icon="exclamation"
              heading="Attestation error:"
              message="Something went wrong!"
              details="Click „Try Again“ button or reload the page or restart your browser."
            />
            <button
              type="button"
              className={flowStyles.ctaButton}
              onClick={handleTryAgainClick}
            >
              Try again
            </button>
          </Fragment>
        )}
      </section>

      <LinkBack />
    </section>
  );
}
