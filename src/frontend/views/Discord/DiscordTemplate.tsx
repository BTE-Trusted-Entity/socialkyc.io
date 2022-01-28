import { MouseEventHandler } from 'react';

import cx from 'classnames';

import { Prompt } from 'react-router-dom';

import * as flowStyles from '../../components/CredentialFlow/CredentialFlow.module.css';
import * as styles from './Discord.module.css';

import { Spinner } from '../../components/Spinner/Spinner';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { Explainer } from '../../components/Explainer/Explainer';

export type AttestationStatus =
  | 'none'
  | 'requested'
  | 'confirming'
  | 'attesting'
  | 'ready'
  | 'error';

interface Props {
  status: AttestationStatus;
  processing: boolean;
  // handleOpenDiscord: MouseEventHandler;
}
export function DiscordTemplate({ status, processing }: Props) {
  const preventNavigation = usePreventNavigation(
    processing || ['confirming', 'attesting'].includes(status),
  );

  return (
    <section
      className={cx(flowStyles.container, {
        [flowStyles.processing]: processing,
      })}
      aria-busy={processing}
    >
      {processing && <Spinner />}

      <h1 className={styles.heading}>Discord Account Attestation</h1>

      <Prompt
        when={preventNavigation}
        message="The email attestation process has already started. Are you sure you want to leave?"
      />

      <Explainer>
        After you sign into your Discord account and give SocialKYC a one-time
        permission, SocialKYC requests your Discord information for the
        credential. You can then sign the data with one of your identities in
        Sporran, and SocialKYC will create the credential.
      </Explainer>

      {status === 'none' && <a className={flowStyles.ctaButton}></a>}
    </section>
  );
}
