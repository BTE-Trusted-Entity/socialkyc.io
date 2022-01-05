import {
  FormEventHandler,
  Fragment,
  MouseEventHandler,
  useCallback,
  useState,
} from 'react';
import { Prompt } from 'react-router-dom';
import cx from 'classnames';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
import * as styles from './Email.module.css';

import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { Spinner } from '../../components/Spinner/Spinner';
import { Explainer } from '../../components/Explainer/Explainer';
import { expiryDate } from '../../utilities/expiryDate';
import { SigningErrorClosed } from '../../components/SigningErrorClosed/SigningErrorClosed';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { AttestationProcessAnchoring } from '../../components/AttestationProcessAnchoring/AttestationProcessAnchoring';
import { AttestationProcessReady } from '../../components/AttestationProcessReady/AttestationProcessReady';
import { AttestationErrorUnknown } from '../../components/AttestationErrorUnknown/AttestationErrorUnknown';
import { LinkBack } from '../../components/LinkBack/LinkBack';

export type AttestationStatus =
  | 'none'
  | 'requested'
  | 'confirming'
  | 'attesting'
  | 'ready'
  | 'error';

export type FlowError = 'closed' | 'expired' | 'unknown';

interface Props2 {
  status: AttestationStatus;
  processing: boolean;
  handleSubmit: FormEventHandler;
  handleBackup: MouseEventHandler;
  handleTryAgainClick: MouseEventHandler;
  setInputError: (error?: string) => void;
  inputError?: string;
  flowError?: FlowError;
}

export function EmailTemplate({
  status,
  processing,
  handleSubmit,
  handleBackup,
  handleTryAgainClick,
  setInputError,
  inputError,
  flowError,
}: Props2): JSX.Element {
  const [emailInput, setEmailInput] = useState('');

  const handleInput = useCallback(
    (event) => {
      setEmailInput(event.target.value);
      setInputError(undefined);
    },
    [setInputError],
  );

  const handleBlur = useCallback(() => {
    const trimmed = emailInput.trim();
    if (trimmed !== emailInput) {
      setEmailInput(trimmed);
    }
  }, [emailInput]);

  const handleKeyPress = useCallback((event) => {
    if (event.key === 'Enter') {
      event.target.blur();
    }
  }, []);

  const preventNavigation = usePreventNavigation(
    processing || ['confirming', 'attesting'].includes(status),
  );

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
              onBlur={handleBlur}
              onKeyPress={handleKeyPress}
            />
          </label>

          <output className={styles.inputError} hidden={!inputError}>
            {inputError}
          </output>

          <p>Validity: one year ({expiryDate})</p>

          {flowError === 'closed' && <SigningErrorClosed />}

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
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Email sent"
          details={`Email sent to ${emailInput}. Please check your inbox and spam folder and click the link.`}
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

      {flowError === 'expired' && (
        <DetailedMessage
          icon="exclamation"
          heading="Attestation error:"
          message="This link has expired."
        />
      )}

      {(flowError === 'unknown' || flowError === 'expired') && (
        <button
          type="button"
          className={flowStyles.ctaButton}
          onClick={handleTryAgainClick}
        >
          Try again
        </button>
      )}

      <LinkBack />
    </section>
  );
}
