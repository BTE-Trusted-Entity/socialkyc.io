import {
  FormEvent,
  FormEventHandler,
  Fragment,
  MouseEventHandler,
  useCallback,
  useRef,
  useState,
} from 'react';
import { Prompt } from 'react-router-dom';
import cx from 'classnames';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
import * as styles from './Twitter.module.css';

import { Spinner } from '../../components/Spinner/Spinner';
import { Explainer } from '../../components/Explainer/Explainer';
import { ExpiryDate } from '../../components/ExpiryDate/ExpiryDate';
import { SigningErrorClosed } from '../../components/SigningErrorClosed/SigningErrorClosed';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { AttestationProcessAnchoring } from '../../components/AttestationProcessAnchoring/AttestationProcessAnchoring';
import { AttestationProcessReady } from '../../components/AttestationProcessReady/AttestationProcessReady';
import { AttestationErrorUnknown } from '../../components/AttestationErrorUnknown/AttestationErrorUnknown';
import { LinkBack } from '../../components/LinkBack/LinkBack';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { useCopyButton } from '../../components/useCopyButton/useCopyButton';

export type AttestationStatus =
  | 'none'
  | 'requested'
  | 'confirming'
  | 'unconfirmed'
  | 'attesting'
  | 'ready'
  | 'error';

export type FlowError = 'closed' | 'unknown';

interface Props {
  status: AttestationStatus;
  processing: boolean;
  handleSubmit: FormEventHandler;
  handleBackup: MouseEventHandler;
  handleTryAgainClick: MouseEventHandler;
  setInputError: (error?: string) => void;
  inputError?: string;
  flowError?: FlowError;
  secret?: string;
}

export function TwitterTemplate({
  status,
  processing,
  handleSubmit,
  handleBackup,
  handleTryAgainClick,
  setInputError,
  inputError,
  flowError,
  secret,
}: Props): JSX.Element {
  const [twitterHandle, setTwitterHandle] = useState('');

  const handleInput = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      setTwitterHandle((event.target as HTMLInputElement).value);
      setInputError(undefined);
    },
    [setInputError],
  );

  const handleBlur = useCallback(() => {
    const trimmed = twitterHandle.trim();
    if (trimmed !== twitterHandle) {
      setTwitterHandle(trimmed);
    }
  }, [twitterHandle]);

  const preventNavigation = usePreventNavigation(
    processing || ['confirming', 'attesting'].includes(status),
  );

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const copy = useCopyButton(messageRef);

  return (
    <section
      className={cx(flowStyles.container, {
        [flowStyles.processing]: processing,
      })}
      aria-busy={processing}
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

            <p>
              Validity: one year (<ExpiryDate />)
            </p>

            {flowError === 'closed' && <SigningErrorClosed />}

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
            <DetailedMessage
              icon="spinner"
              heading="Attestation process:"
              message="Starting"
              details="Your credential will be attested as soon as you Tweet the text below."
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
                <a className={flowStyles.ctaLink} href="https://twitter.com/">
                  Go to Twitter
                </a>
              </p>
            </div>
          </Fragment>
        )}

        {status === 'unconfirmed' && (
          <DetailedMessage
            icon="exclamation"
            heading="Attestation error:"
            message="Tweet not found"
            details="SocialKYC could not find your tweet. Please make sure you tweet the text exactly as provided. You can use the copy button to avoid any typos."
          />
        )}

        {status === 'attesting' && <AttestationProcessAnchoring />}

        {status === 'ready' && (
          <Fragment>
            <AttestationProcessReady />
            <button
              className={flowStyles.ctaButton}
              type="button"
              onClick={handleBackup}
            >
              Show credential in wallet
            </button>
          </Fragment>
        )}

        {flowError === 'unknown' && <AttestationErrorUnknown />}

        {(status === 'unconfirmed' || flowError === 'unknown') && (
          <button
            type="button"
            className={flowStyles.ctaButton}
            onClick={handleTryAgainClick}
          >
            Try again
          </button>
        )}
      </section>

      <LinkBack />
    </section>
  );
}
