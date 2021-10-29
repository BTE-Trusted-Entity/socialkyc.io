import { useCallback, useState } from 'react';
import { Link, Route } from 'react-router-dom';
import ky from 'ky';
import { StatusCodes } from 'http-status-codes';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { getSession } from '../../utilities/session';
import { usePreventNavigation } from '../../utilities/usePreventNavigation';

import { Expandable } from '../../components/Expandable/Expandable';

import { paths } from '../../../backend/endpoints/paths';

import * as styles from './Email.module.css';

export function Email(): JSX.Element {
  const [emailInput, setEmailInput] = useState('');

  const handleInput = useCallback((event) => {
    setEmailInput(event.target.value);
  }, []);

  const [email, setEmail] = useState('');

  const [processing, setProcessing] = useState(false);
  usePreventNavigation(processing);

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault();
      setProcessing(true);

      try {
        const session = await getSession();
        await session.listen(async (message) => {
          const result = await ky.post(paths.requestAttestationEmail, {
            json: message,
          });

          if (result.status === StatusCodes.ACCEPTED) {
            console.log('Terms rejected');
          }

          if (result.status !== StatusCodes.OK) {
            console.log('Not attested');
            return;
          }

          setEmail(await result.text());
        });

        const json = {
          email: emailInput,
          did: session.identity,
        };

        const message = (await ky
          .post(paths.quoteEmail, { json })
          .json()) as IEncryptedMessage;

        console.log('Message: ', message);

        await session.send(message);
      } catch (error) {
        console.error(error);
      } finally {
        setProcessing(false);
      }
    },
    [emailInput],
  );

  return (
    <Expandable path="/email" label="Email" processing={processing}>
      <Route path="/email">
        {email ? (
          <div className={styles.success}>
            <p>
              We’ve sent an email to <strong>{email}</strong>
            </p>
            <p>Please check your inbox!</p>
            <Link to="/" type="button" className={styles.buttonPrimary}>
              OK
            </Link>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <label className={styles.formLabel}>
              Your email address
              <input
                className={styles.formInput}
                onInput={handleInput}
                type="email"
                name="email"
                required
              />
            </label>

            <button
              type="submit"
              className={styles.chooseIdentity}
              disabled={!emailInput}
            >
              Choose Sporran Identity
            </button>
          </form>
        )}
      </Route>
    </Expandable>
  );
}
