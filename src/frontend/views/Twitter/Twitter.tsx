import { Fragment, useCallback, useRef, useState } from 'react';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { getSession } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { useCopyButton } from '../../components/useCopyButton/useCopyButton';
import { expiryDate } from '../../utilities/expiryDate';

import { Explainer } from '../../components/Explainer/Explainer';
import { Expandable } from '../../components/Expandable/Expandable';

import { confirmTwitter } from '../../../backend/twitter/confirmTwitterApi';
import { attestTwitter } from '../../../backend/twitter/attestationTwitterApi';
import { quoteTwitter } from '../../../backend/twitter/quoteTwitterApi';
import { requestAttestationTwitter } from '../../../backend/twitter/requestAttestationTwitterApi';

import * as styles from './Twitter.module.css';

type AttestationStatus =
  | 'none'
  | 'requested'
  | 'confirming'
  | 'attesting'
  | 'ready'
  | 'error';

export function Twitter(): JSX.Element {
  const [twitterHandle, setTwitterHandle] = useState('');

  const handleInput = useCallback((event) => {
    setTwitterHandle(event.target.value);
  }, []);

  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<AttestationStatus>('none');

  const [code, setCode] = useState('');

  const showSpinner = ['confirming', 'attesting'].includes(status);
  const showReady = status === 'ready';

  usePreventNavigation(processing || showSpinner);

  const messageRef = useRef<HTMLTextAreaElement>(null);
  const copy = useCopyButton(messageRef);

  const [backupMessage, setBackupMessage] = useState<
    IEncryptedMessage | undefined
  >();

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProcessing(true);

      try {
        const session = await getSession();

        await session.listen(async (message) => {
          try {
            const { key, code } = await requestAttestationTwitter(message);
            setCode(code);
            setStatus('confirming');
            setProcessing(false);

            await confirmTwitter({
              key,
              did: session.identity,
            });
            setStatus('attesting');

            const attestationMessage = await attestTwitter({ key });
            setBackupMessage(attestationMessage);

            setStatus('ready');
          } catch {
            setStatus('error');
          }
        });

        const message = await quoteTwitter({
          username: twitterHandle,
          did: session.identity,
        });

        setStatus('requested');
        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
      } finally {
        setProcessing(false);
      }
    },
    [twitterHandle],
  );

  const handleBackup = useCallback(async () => {
    if (!backupMessage) {
      return;
    }
    try {
      const session = await getSession();
      await session.send(backupMessage);
    } catch (error) {
      console.error(error);
    }
  }, [backupMessage]);

  return (
    <Expandable path="/twitter" label="Twitter" processing={processing}>
      <Explainer>
        After you type in your Twitter handle, please choose an identity in your
        wallet to associate with your Twitter credential. In order to verify
        your credential we will prompt you to Tweet from this account.
      </Explainer>
      <section>
        {status === 'none' && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.formLabel}>
              Your Twitter handle
              <div className={styles.twitterInputContainer}>
                <input
                  className={styles.twitterInput}
                  onInput={handleInput}
                  type="text"
                  name="twitterHandle"
                  required
                />
              </div>
            </label>
            <p className={styles.subline}>Validity: one year ({expiryDate})</p>
            <button
              type="submit"
              className={styles.chooseIdentity}
              disabled={!twitterHandle}
            >
              Choose Sporran Identity
            </button>
          </form>
        )}
        {status !== 'none' && (
          <div className={styles.statusContainer}>
            {showSpinner && <div className={styles.spinner} />}
            {showReady && <div className={styles.ready} />}

            <h2 className={styles.heading}>Attestation process:</h2>
            {status === 'confirming' && (
              <Fragment>
                <p className={styles.status}>Starting</p>
                <p className={styles.subline}>
                  Your credential will be verified as soon as you tweet the text
                  below.
                </p>
              </Fragment>
            )}

            {status === 'attesting' && (
              <Fragment>
                <p className={styles.status}>In progress</p>
                <p className={styles.subline}>
                  SocialKYC confirmed your Twitter handle and is issuing the
                  credential.
                </p>
              </Fragment>
            )}

            {status === 'ready' && (
              <Fragment>
                <p className={styles.status}>Credential is ready</p>
                <p className={styles.subline}>
                  SocialKYC recommends to back up your credential now.
                </p>
              </Fragment>
            )}

            {/* TODO: Interface for error */}
            {status === 'error' && <p>Oops, there was an error.</p>}
          </div>
        )}
        {status === 'confirming' && (
          <div>
            <label htmlFor="tweet">Please tweet this message:</label>
            <p className={styles.tweetContainer}>
              <textarea
                className={styles.tweetInput}
                id="tweet"
                ref={messageRef}
                value={`I just created my decentralized credentials with #socialKYC. Regain control of your personal data and protect your digital identity with #socialKYC now. ${code}`}
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
            <p className={styles.ctaLine}>
              <a
                className={styles.cta}
                href="https://twitter.com/"
                target="_blank"
                rel="noreferrer noopener"
              >
                Go to Twitter
              </a>
            </p>
          </div>
        )}
        {status === 'ready' && (
          <p className={styles.ctaLine}>
            <button className={styles.cta} type="button" onClick={handleBackup}>
              Back up credential
            </button>
          </p>
        )}
      </section>
    </Expandable>
  );
}
