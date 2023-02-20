import cx from 'classnames';

import { Prompt } from 'react-router-dom';

import { FormEventHandler, MouseEventHandler, Fragment } from 'react';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
import * as styles from './Github.module.css';

import { Spinner } from '../../components/Spinner/Spinner';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { Explainer } from '../../components/Explainer/Explainer';
import { LinkBack } from '../../components/LinkBack/LinkBack';
import { AttestationErrorUnknown } from '../../components/AttestationErrorUnknown/AttestationErrorUnknown';
import { ExpiryDate } from '../../components/ExpiryDate/ExpiryDate';
import { DetailedMessage } from '../../components/DetailedMessage/DetailedMessage';
import { AttestationProcessAnchoring } from '../../components/AttestationProcessAnchoring/AttestationProcessAnchoring';
import { AttestationProcessReady } from '../../components/AttestationProcessReady/AttestationProcessReady';
import { SigningErrorClosed } from '../../components/SigningErrorClosed/SigningErrorClosed';

import { GithubProfile } from './Github';

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
  authUrl?: string;
  flowError?: FlowError;
  profile?: GithubProfile;
}

export function GithubTemplate({
  status,
  processing,
  handleSubmit,
  handleBackup,
  handleTryAgainClick,
  authUrl,
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

      <h1 className={styles.heading}>Github Account Attestation</h1>

      <Prompt
        when={preventNavigation}
        message="The Github attestation process has already started. Are you sure you want to leave?"
      />

      <Explainer>
        After you sign into your GitHub account and give SocialKYC permission,
        SocialKYC requests your GitHub information for the credential. You can
        then sign the data with one of your identities in Sporran, and SocialKYC
        will create the credential.
      </Explainer>

      {status === 'none' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Generating link"
          details="Please wait, generating GitHub authorization link."
        />
      )}

      {status === 'urlReady' && (
        <p className={styles.buttonsLine}>
          <a className={styles.ctaButton} href={authUrl}>
            Sign in with GitHub
          </a>
        </p>
      )}

      {status === 'authorizing' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Authorizing"
          details="Please wait, accessing Github account details."
        />
      )}

      {status === 'authorized' && profile && (
        <form onSubmit={handleSubmit}>
          <dl className={styles.profile}>
            <dt>User-ID:</dt>
            <dd>{profile['User ID']}</dd>

            <dt>Username:</dt>
            <dd>{profile.Username}</dd>
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
          message="There was an error authorizing your Github account."
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
