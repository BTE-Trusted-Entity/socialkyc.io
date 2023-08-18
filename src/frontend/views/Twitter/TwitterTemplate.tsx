import {
  FormEvent,
  FormEventHandler,
  Fragment,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useRef,
  useState,
} from 'react';
import { Prompt } from 'react-router-dom';

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

import { TwitterProfile } from './Twitter';

export type AttestationStatus =
  | 'none'
  | 'authenticating'
  | 'authenticated'
  | 'attesting'
  | 'ready'
  | 'error';

export type FlowError = 'timeout' | 'closed' | 'unknown';

interface Props {
  status: AttestationStatus;
  processing: boolean;
  handleClaim: FormEventHandler;
  handleRequestAttestation: FormEventHandler;
  handleBackup: MouseEventHandler;
  handleTryAgainClick: MouseEventHandler;
  setInputError: (error?: string) => void;
  inputError?: string;
  flowError?: FlowError;
  secret?: string;
  profile?: TwitterProfile;
}

export function TwitterTemplate({
  status,
  processing,
  handleClaim,
  handleRequestAttestation,
  handleBackup,
  handleTryAgainClick,
  setInputError,
  inputError,
  flowError,
  secret,
  profile,
}: Props) {
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

  const handleKeyPress: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (event.key === 'Enter') {
        (event.target as HTMLInputElement).blur();
      }
    },
    [],
  );

  const preventNavigation = usePreventNavigation(
    processing ||
      ['authenticating', 'authenticated', 'attesting'].includes(status),
  );

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const copy = useCopyButton(messageRef);

  return (
    <section className={flowStyles.container} aria-busy={processing}>
      {processing && <Spinner />}

      <h1 className={styles.heading}>Twitter Account Attestation</h1>

      <Prompt
        when={preventNavigation}
        message="The Twitter attestation process has already started. Are you sure you want to leave?"
      />

      <Explainer>
        After entering your Twitter handle, we will prompt you to make an
        authentication Tweet with text we provide. When the authentication is
        complete, you can sign with one of your identities in Sporran, and
        SocialKYC will create the credential.
      </Explainer>

      <section>
        {status === 'none' && (
          <form onSubmit={handleClaim}>
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
                  onKeyPress={handleKeyPress}
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

            <button
              type="submit"
              className={flowStyles.ctaButton}
              disabled={!twitterHandle}
            >
              Continue
            </button>
          </form>
        )}

        {status === 'authenticating' && (
          <Fragment>
            <DetailedMessage
              icon="spinner"
              heading="Attestation process:"
              message="Starting"
              details="To continue the attestation process, please Tweet the text below and then return to this page. It may take SocialKYC a moment to complete the process."
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

        {status === 'authenticated' && profile && (
          <form onSubmit={handleRequestAttestation}>
            <dl className={styles.profile}>
              <dt>Twitter handle:</dt>
              <dd>{profile.Twitter}</dd>
            </dl>

            <p>
              Validity: one year (<ExpiryDate />)
            </p>

            {flowError === 'closed' && <SigningErrorClosed />}

            <button type="submit" className={flowStyles.ctaButton}>
              Continue in wallet
            </button>
          </form>
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

        {flowError === 'timeout' && (
          <DetailedMessage
            icon="exclamation"
            heading="Attestation error:"
            message="Tweet not found"
            details="SocialKYC could not find your tweet. Please make sure you tweet the text exactly as provided. You can use the copy button to avoid any typos."
          />
        )}

        {flowError === 'unknown' && <AttestationErrorUnknown />}

        {(flowError === 'timeout' || flowError === 'unknown') && (
          <button
            type="button"
            className={flowStyles.ctaButton}
            onClick={handleTryAgainClick}
          >
            Try again
          </button>
        )}
      </section>

      {!preventNavigation && <LinkBack />}
    </section>
  );
}
