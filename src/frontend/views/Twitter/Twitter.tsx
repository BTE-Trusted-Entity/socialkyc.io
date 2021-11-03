import { useCallback, useState } from 'react';

import { getSession } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';
import { expiryDate } from '../../utilities/expiryDate';

import { Explainer } from '../../components/Explainer/Explainer';
import { Expandable } from '../../components/Expandable/Expandable';

import { attestTwitter } from '../../../backend/endpoints/attestationTwitterApi';
import { quoteTwitter } from '../../../backend/endpoints/quoteTwitterApi';
import { requestAttestationTwitter } from '../../../backend/endpoints/requestAttestationTwitterApi';

import * as styles from './Twitter.module.css';

export function Twitter(): JSX.Element {
  const [twitterHandle, setTwitterHandle] = useState('');

  const handleInput = useCallback((event) => {
    setTwitterHandle(event.target.value);
  }, []);

  const [processing, setProcessing] = useState(false);
  usePreventNavigation(processing);

  const [code, setCode] = useState('');

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProcessing(true);

      try {
        const session = await getSession();

        await session.listen(async (message) => {
          const { key, code, twitter } = await requestAttestationTwitter(
            message,
          );
          setCode(code);

          const attestationData = await attestTwitter({
            key,
            twitter,
            did: session.identity,
          });

          console.log('Attestation data: ', attestationData);

          // TODO: https://kiltprotocol.atlassian.net/browse/SK-521
        });

        const message = await quoteTwitter({
          twitter: twitterHandle,
          did: session.identity,
        });

        await session.send(message);
      } catch (error) {
        console.error(error);
      } finally {
        setProcessing(false);
      }
    },
    [twitterHandle],
  );

  return (
    <Expandable path="/twitter" label="Twitter" processing={processing}>
      <Explainer>
        After you type in your Twitter handle, please choose an identity in your
        wallet to associate with your Twitter credential. In order to verify
        your credential we will prompt you to Tweet from this account.
      </Explainer>
      <section>
        {!code && (
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
      </section>
    </Expandable>
  );
}
