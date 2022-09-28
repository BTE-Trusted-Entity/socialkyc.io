import cx from 'classnames';

import { Prompt } from 'react-router-dom';

import { FormEventHandler, MouseEventHandler, Fragment } from 'react';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
import * as styles from './Youtube.module.css';

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

import { YoutubeChannel } from './Youtube';

export type AttestationStatus =
  | 'none'
  | 'urlReady'
  | 'authorizing'
  | 'authorized'
  | 'attesting'
  | 'ready'
  | 'error';

export type FlowError = 'unauthorized' | 'closed' | 'unknown' | 'noChannel';

interface Props {
  status: AttestationStatus;
  processing: boolean;
  handleSubmit: FormEventHandler;
  handleBackup: MouseEventHandler;
  handleTryAgainClick: MouseEventHandler;
  authUrl?: string;
  flowError?: FlowError;
  channel?: YoutubeChannel;
}

export function YoutubeTemplate({
  status,
  processing,
  handleSubmit,
  handleBackup,
  handleTryAgainClick,
  authUrl,
  flowError,
  channel,
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

      <h1 className={styles.heading}>YouTube Channel Attestation</h1>

      <Prompt
        when={preventNavigation}
        message="The YouTube attestation process has already started. Are you sure you want to leave?"
      />

      <Explainer>
        SocialKYC creates a credential for your YouTube channel. If you haven’t
        created a channel for your YouTube account, do that before you begin.
        Sign into your YouTube account, select your channel, and allow SocialKYC
        one-time permission to access your channel information. You can then
        sign the data with your identity in Sporran, and SocialKYC will create
        the credential for the channel you selected. If you have more than one
        channel, this process may be repeated.
      </Explainer>

      {status === 'none' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Generating link"
          details="Please wait, generating YouTube authorization link."
        />
      )}

      {status === 'urlReady' && (
        <p className={styles.buttonsLine}>
          <a
            className={styles.youtubeButton}
            href={authUrl}
            aria-label="Sign in with Youtube"
          >
            Sign-in with
          </a>
        </p>
      )}

      {status === 'authorizing' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Authorizing"
          details="Please wait, accessing YouTube channel details."
        />
      )}

      {status === 'authorized' && channel && (
        <form onSubmit={handleSubmit}>
          <dl className={styles.channel}>
            <dt>Channel-ID:</dt>
            <dd>{channel.id}</dd>

            <dt>Channel name:</dt>
            <dd>{channel.name}</dd>
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
          message="There was an error authorizing your YouTube channel."
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

      {flowError === 'noChannel' && (
        <Fragment>
          <DetailedMessage
            icon="exclamation"
            heading="Channel error:"
            message="No YouTube channel could be found associated with your YouTube account."
            details="Please create a YouTube channel with your account before restarting the credential process."
          />
          <p className={styles.buttonsLine}>
            <a
              className={styles.youtubeButton}
              aria-label="Open Youtube"
              href="https://www.youtube.com/account"
              target="_blank"
              rel="noreferrer"
            >
              Open
            </a>
          </p>
        </Fragment>
      )}
      <LinkBack />
    </section>
  );
}
