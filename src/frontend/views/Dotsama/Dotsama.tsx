import { Fragment, useCallback, useState } from 'react';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { Session } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { expiryDate } from '../../utilities/expiryDate';

import { Explainer } from '../../components/Explainer/Explainer';
import { Expandable } from '../../components/Expandable/Expandable';
import { AttestationProcess } from '../../components/AttestationProcess/AttestationProcess';

import { quoteDotsama } from '../../../backend/dotsama/quoteDotsamaApi';
import { requestAttestationDotsama } from '../../../backend/dotsama/requestAttestationDotsamaApi';
import { attestDotsama } from '../../../backend/dotsama/attestationDotsamaApi';

import * as styles from './Dotsama.module.css';

type AttestationStatus = 'none' | 'requested' | 'attesting' | 'ready' | 'error';

interface Props {
  session: Session;
}

export function Dotsama({ session }: Props): JSX.Element {
  const [name, setName] = useState('');

  const handleInput = useCallback((event) => {
    setName(event.target.value);
  }, []);

  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<AttestationStatus>('none');

  const showSpinner = status === 'attesting';
  const showReady = status === 'ready';

  usePreventNavigation(processing || showSpinner);

  const [backupMessage, setBackupMessage] = useState<
    IEncryptedMessage | undefined
  >();

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProcessing(true);

      try {
        const { sessionId } = session;

        await session.listen(async (message) => {
          try {
            await requestAttestationDotsama({ sessionId, message });
            setStatus('attesting');
            setProcessing(false);

            const attestationMessage = await attestDotsama({ sessionId });
            setBackupMessage(attestationMessage);

            setStatus('ready');
          } catch {
            setStatus('error');
          }
        });

        const message = await quoteDotsama({ name, sessionId });

        setStatus('requested');
        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
      } finally {
        setProcessing(false);
      }
    },
    [session, name],
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

  return (
    <Expandable path="/dotsama" label="Dotsama Name" processing={processing}>
      <Explainer>
        After entering your desired Dotsama name, please choose an identity in
        your wallet to associate with your Dotsama credential.
        <br />
        Please note: Your Dotsama name can potentially be chosen by any other
        user too. It can not be verified exclusively for you.
      </Explainer>

      {status === 'none' && (
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.formLabel}>
            Your desired Dotsama name
            <input
              className={styles.nameInput}
              onInput={handleInput}
              type="text"
              name="name"
              required
            />
          </label>

          <p className={styles.subline}>Validity: one year ({expiryDate})</p>

          <button
            type="submit"
            className={styles.chooseIdentity}
            disabled={!name}
          >
            Continue in wallet
          </button>
        </form>
      )}

      {status === 'attesting' && (
        <AttestationProcess
          spinner={showSpinner}
          ready={showReady}
          status="Anchoring credential on KILT blockchain"
          subline="Please leave this tab open until your credential is attested."
        />
      )}

      {status === 'ready' && (
        <Fragment>
          <AttestationProcess
            spinner={showSpinner}
            ready={showReady}
            status="Credential is ready"
            subline="We recommend that you back up your credential now."
          />

          <p className={styles.ctaLine}>
            <button className={styles.cta} type="button" onClick={handleBackup}>
              Back up credential
            </button>
          </p>
        </Fragment>
      )}

      {status === 'error' && (
        <AttestationProcess
          spinner={showSpinner}
          ready={showReady}
          error="Oops, there was an error."
        />
      )}
    </Expandable>
  );
}
