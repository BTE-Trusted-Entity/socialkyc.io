import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { Rejection, Session } from '../../utilities/session';
import { useValuesFromRedirectUri } from '../../utilities/useValuesFromRedirectUri';
import { InvalidEmail } from '../../../backend/email/requestAttestationEmailApi';

import { useEmailApi } from './useEmailApi';
import { AttestationStatus, EmailTemplate, FlowError } from './EmailTemplate';

interface Props {
  session: Session;
}

export function Email({ session }: Props): JSX.Element {
  const [inputError, setInputError] = useState<string>();

  const { secret } = useValuesFromRedirectUri(true);

  const initialStatus = secret ? 'confirming' : 'none';

  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const emailApi = useEmailApi(session.sessionId);
  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();
  useEffect(() => {
    if (!secret) {
      return;
    }
    (async () => {
      // step 3): we clicked on redirect link (we have the secret in query params), we now send secret to backend
      try {
        await emailApi.confirm({ secret });
        setStatus('attesting');
      } catch {
        setStatus('error');
        setFlowError('expired');
        return;
      }
      // step 4): everything is done but we are polling an endpoint for a finalization confirmation in order to inform the user
      try {
        setBackupMessage(await emailApi.attest({}));
        setStatus('ready'); // isn't that 'done' at this point? ready sounds like we are at the very beginning
      } catch {
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [emailApi, secret]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setInputError(undefined);
      setFlowError(undefined);

      const formData = new FormData(event.target as HTMLFormElement);
      const emailInput = formData.get('email') as string;

      try {
        await session.listen(async (message) => {
          // step 2): if sporran replies with request for attestation, forward it to backend
          try {
            const { wallet } = session;
            await emailApi.requestAttestation({ message, wallet });
            setStatus('requested');
          } catch (exception) {
            if (exception instanceof Rejection) {
              setFlowError('closed');
            } else if (exception instanceof InvalidEmail) {
              setInputError('Incorrect email format, please review.'); // not sure why, but this never appears even on invalid email addresses.
            } else {
              console.error(exception);
              setFlowError('unknown');
              setStatus('error');
            }
          }
        });

        // step 1): prepares quote and packs into encrypted message for sporran
        const message = await emailApi.quote({ email: emailInput });

        // sends quote message to sporran
        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [emailApi, session],
  );

  const handleBackup = useCallback(async () => {
    try {
      if (!backupMessage) {
        throw new Error('No backup message');
      }
      await session.send(backupMessage);
    } catch (exception) {
      if (exception instanceof Rejection) {
        return; // don’t care that the user has closed the dialog
      }
      setFlowError('unknown');
      console.error(exception);
    }
  }, [backupMessage, session]);

  const handleTryAgainClick = useCallback(() => {
    setStatus('none');
    setFlowError(undefined);
  }, []);

  return (
    <EmailTemplate
      status={status}
      processing={processing}
      flowError={flowError}
      inputError={inputError}
      setInputError={setInputError}
      handleSubmit={handleSubmit}
      handleBackup={handleBackup}
      handleTryAgainClick={handleTryAgainClick}
    />
  );
}
