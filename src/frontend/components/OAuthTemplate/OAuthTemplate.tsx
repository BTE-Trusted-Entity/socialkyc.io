import { Prompt } from 'react-router-dom';

import {
  FormEventHandler,
  Fragment,
  MouseEventHandler,
  ReactNode,
  useMemo,
} from 'react';

import * as flowStyles from '../CredentialFlow/CredentialFlow.module.css';
import * as styles from './OAuthTemplate.module.css';

import { Spinner } from '../Spinner/Spinner';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { OAuthExplainer } from '../OAuthExplainer/OAuthExplainer';
import { LinkBack } from '../LinkBack/LinkBack';
import { AttestationErrorUnknown } from '../AttestationErrorUnknown/AttestationErrorUnknown';
import { ExpiryDate } from '../ExpiryDate/ExpiryDate';
import { DetailedMessage } from '../DetailedMessage/DetailedMessage';
import { AttestationProcessAnchoring } from '../AttestationProcessAnchoring/AttestationProcessAnchoring';
import { AttestationProcessReady } from '../AttestationProcessReady/AttestationProcessReady';
import { SigningErrorClosed } from '../SigningErrorClosed/SigningErrorClosed';

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
  service: string;
  backgroundImage?: string;
  status: AttestationStatus;
  processing: boolean;
  handleSubmit: FormEventHandler;
  handleBackup: MouseEventHandler;
  handleTryAgainClick: MouseEventHandler;
  authUrl?: string;
  authUrlLoader?: ReactNode;
  flowError?: FlowError;
  profile?: ReactNode;
}

export function OAuthTemplate({
  service,
  backgroundImage,
  status,
  processing,
  handleSubmit,
  handleBackup,
  handleTryAgainClick,
  authUrl,
  authUrlLoader,
  flowError,
  profile,
}: Props): JSX.Element {
  const preventNavigation = usePreventNavigation(
    processing || ['authorizing', 'authorized', 'attesting'].includes(status),
  );

  const style = useMemo(
    () =>
      backgroundImage
        ? { backgroundImage: `url(${backgroundImage})` }
        : undefined,
    [backgroundImage],
  );

  return (
    <section className={flowStyles.container} aria-busy={processing}>
      {processing && <Spinner />}

      <h1 className={styles.heading} style={style}>
        {service} Account Attestation
      </h1>

      <Prompt
        when={preventNavigation}
        message={`The ${service} attestation process has already started. Are you sure you want to leave?`}
      />

      <OAuthExplainer service={service} />

      {status === 'none' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Generating link"
          details={`Please wait, generating ${service} authorization link.`}
        />
      )}

      {authUrlLoader && <p className={styles.buttonsLine}>{authUrlLoader}</p>}

      {status === 'urlReady' && !authUrlLoader && (
        <p className={styles.buttonsLine}>
          <a className={styles.ctaButton} href={authUrl}>
            Sign in with {service}
          </a>
        </p>
      )}

      {status === 'authorizing' && (
        <DetailedMessage
          icon="spinner"
          heading="Attestation process:"
          message="Authorizing"
          details={`Please wait, accessing ${service} account details.`}
        />
      )}

      {status === 'authorized' && profile && (
        <form onSubmit={handleSubmit}>
          <dl className={styles.profile}>{profile}</dl>

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
          message={`There was an error authorizing your ${service} account.`}
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
