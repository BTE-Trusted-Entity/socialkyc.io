import {
  FormEvent,
  FormEventHandler,
  Fragment,
  KeyboardEventHandler,
  MouseEventHandler,
  useCallback,
  useState,
} from 'react';
import { Prompt } from 'react-router-dom';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
import * as styles from './Email.module.css';

import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { Spinner } from '../../components/Spinner/Spinner';
import { Explainer } from '../../components/Explainer/Explainer';
import { ExpiryDate } from '../../components/ExpiryDate/ExpiryDate';
import { SigningErrorClosed } from '../../components/SigningErrorClosed/SigningErrorClosed';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { AttestationProcessAnchoring } from '../../components/AttestationProcessAnchoring/AttestationProcessAnchoring';
import { AttestationProcessReady } from '../../components/AttestationProcessReady/AttestationProcessReady';
import { AttestationErrorUnknown } from '../../components/AttestationErrorUnknown/AttestationErrorUnknown';
import { LinkBack } from '../../components/LinkBack/LinkBack';

import { EmailProfile } from './Email';

export type AttestationStatus =
  | 'none'
  | 'emailSent'
  | 'authenticating'
  | 'authenticated'
  | 'attesting'
  | 'ready'
  | 'error';

export type FlowError = 'closed' | 'expired' | 'unknown';

interface Props {
  status: AttestationStatus;
  processing: boolean;
  handleSendEmail: FormEventHandler;
  handleRequestAttestation: FormEventHandler;
  handleBackup: MouseEventHandler;
  handleTryAgainClick: MouseEventHandler;
  setInputError: (error?: string) => void;
  inputError?: string;
  flowError?: FlowError;
  profile?: EmailProfile;
}

export function EmailTemplate({
  status,
  processing,
  handleSendEmail,
  handleRequestAttestation,
  handleBackup,
  handleTryAgainClick,
  setInputError,
  inputError,
  flowError,
  profile,
}: Props) {
  const [emailInput, setEmailInput] = useState('');
  const unicodeEmail = profile?.Email || emailInput;

  const handleInput = useCallback(
    (event: FormEvent<HTMLInputElement>) => {
      setEmailInput((event.target as HTMLInputElement).value);
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

  return (
    <section className={flowStyles.container} aria-busy={processing}>
      {processing && <Spinner />}

      <h1 className={styles.heading}>Email Address Attestation</h1>

      <Prompt
        when={preventNavigation}
        message="The email attestation process has already started. Are you sure you want to leave?"
      />

      <Explainer>
        We will email you a confirmation link. After confirming your email
        address, you can sign the data with one of your identities in Sporran,
        and SocialKYC will create the credential.
      </Explainer>

      {status === 'none' && (
        <form onSubmit={handleSendEmail}>
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

          <p>
            Validity: one year (<ExpiryDate />)
          </p>

          <button
            type="submit"
            className={flowStyles.ctaButton}
            disabled={!emailInput}
          >
            Send email
          </button>
        </form>
      )}

      {status === 'emailSent' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Email sent"
          details={`Email sent to ${unicodeEmail}. Please check your inbox and spam folder and click the link.`}
        />
      )}

      {status === 'authenticating' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Authorizing"
          details="Please wait, confirming email."
        />
      )}

      {status === 'authenticated' && profile && (
        <form onSubmit={handleRequestAttestation}>
          <dl className={styles.profile}>
            <dt>Email:</dt>
            <dd>{profile.Email}</dd>
          </dl>

          <p>
            Validity: one year (<ExpiryDate />)
          </p>

          {flowError === 'closed' && <SigningErrorClosed />}

          <button className={flowStyles.ctaButton}>Continue in wallet</button>
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

      {!preventNavigation && <LinkBack />}
    </section>
  );
}
