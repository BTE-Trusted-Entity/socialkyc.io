import {
  FormEventHandler,
  Fragment,
  MouseEventHandler,
  ReactNode,
} from 'react';
import { Prompt } from 'react-router-dom';
import cx from 'classnames';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
import * as styles from './Telegram.module.css';

import { Spinner } from '../../components/Spinner/Spinner';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { OAuthExplainer } from '../../components/OAuthExplainer/OAuthExplainer';
import { LinkBack } from '../../components/LinkBack/LinkBack';
import { AttestationErrorUnknown } from '../../components/AttestationErrorUnknown/AttestationErrorUnknown';
import { ExpiryDate } from '../../components/ExpiryDate/ExpiryDate';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { AttestationProcessAnchoring } from '../../components/AttestationProcessAnchoring/AttestationProcessAnchoring';
import { AttestationProcessReady } from '../../components/AttestationProcessReady/AttestationProcessReady';
import { SigningErrorClosed } from '../../components/SigningErrorClosed/SigningErrorClosed';

import { TelegramProfile } from './Telegram';

export type AttestationStatus =
  | 'none'
  | 'urlReady'
  | 'authorizing'
  | 'authorized'
  | 'attesting'
  | 'ready'
  | 'error';

export type FlowError = 'unauthorized' | 'closed' | 'unknown';

interface Props {
  status: AttestationStatus;
  processing: boolean;
  handleSubmit: FormEventHandler;
  handleBackup: MouseEventHandler;
  handleTryAgainClick: MouseEventHandler;
  authUrlLoader?: ReactNode;
  flowError?: FlowError;
  profile?: TelegramProfile;
}

export function TelegramTemplate({
  status,
  processing,
  handleSubmit,
  handleBackup,
  handleTryAgainClick,
  authUrlLoader,
  flowError,
  profile,
}: Props): JSX.Element {
  const preventNavigation = usePreventNavigation(
    processing || ['authorizing', 'authorized', 'attesting'].includes(status),
  );

  return (
    <section
      className={cx(flowStyles.container, {
        [flowStyles.processing]: processing,
      })}
      aria-busy={processing}
    >
      {processing && <Spinner />}

      <h1 className={styles.heading}>Telegram Account Attestation</h1>

      <Prompt
        when={preventNavigation}
        message="The Telegram attestation process has already started. Are you sure you want to leave?"
      />

      <OAuthExplainer service="Telegram" />

      {status === 'none' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Generating link"
          details="Please wait, generating Telegram authorization link."
        />
      )}

      {authUrlLoader && <p className={styles.buttonsLine}>{authUrlLoader}</p>}

      {status === 'authorizing' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Authorizing"
          details="Please wait, accessing Telegram account details."
        />
      )}

      {status === 'authorized' && profile && (
        <form onSubmit={handleSubmit}>
          <dl className={styles.profile}>
            <dt>User-ID:</dt>
            <dd>{profile['User ID']}</dd>

            <dt>First name:</dt>
            <dd>{profile['First name']}</dd>

            {profile['Last name'] && (
              <Fragment>
                <dt>Last name:</dt>
                <dd>{profile['Last name']}</dd>
              </Fragment>
            )}

            {profile.Username && (
              <Fragment>
                <dt>Username:</dt>
                <dd>{profile.Username}</dd>
              </Fragment>
            )}
          </dl>

          <p>
            Validity: one year (<ExpiryDate />)
          </p>

          {flowError === 'closed' && <SigningErrorClosed />}

          <button className={flowStyles.ctaButton}>Continue in Wallet</button>
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

      {flowError === 'unauthorized' && (
        <DetailedMessage
          icon="exclamation"
          heading="Authorization error:"
          message="There was an error authorizing your Telegram account."
          details="Click “Try Again” or reload the page or restart your browser."
        />
      )}

      {(flowError === 'unknown' || flowError === 'unauthorized') && (
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
