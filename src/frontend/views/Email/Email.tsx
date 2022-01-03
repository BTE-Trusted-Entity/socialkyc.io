import { FormEvent, useCallback, useEffect, useState } from 'react';
import { useRouteMatch } from 'react-router-dom';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { Session } from '../../utilities/session';
import { exceptionToError } from '../../utilities/exceptionToError';

import { attestEmail } from '../../../backend/email/attestationEmailApi';
import { confirmEmail } from '../../../backend/email/confirmEmailApi';
import { quoteEmail } from '../../../backend/email/quoteEmailApi';
import { requestAttestationEmail } from '../../../backend/email/sendEmailApi';
import { paths } from '../../paths';

import { AttestationStatus, EmailTemplate, FlowError } from './EmailTemplate';

interface Props {
  session: Session;
}

export function Email({ session }: Props): JSX.Element {
  const [inputError, setInputError] = useState<string>();

  const secret = (
    useRouteMatch(paths.emailConfirmation)?.params as { secret?: string }
  )?.secret;

  const initialStatus = secret ? 'confirming' : 'none';

  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const { sessionId } = session;
  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();
  useEffect(() => {
    if (!secret) {
      return;
    }
    (async () => {
      try {
        await confirmEmail({ secret, sessionId });
        setStatus('attesting');
      } catch {
        setStatus('error');
        setFlowError('expired');
        return;
      }
      try {
        setBackupMessage(await attestEmail({ sessionId }));
        setStatus('ready');
      } catch {
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [secret, sessionId]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setInputError(undefined);
      setFlowError(undefined);

      const formData = new FormData(event.target as HTMLFormElement);
      const emailInput = formData.get('email') as string;

      try {
        const { sessionId } = session;

        await session.listen(async (message) => {
          try {
            await requestAttestationEmail({ sessionId, message });
            setStatus('requested');
          } catch (exception) {
            const { message } = exceptionToError(exception);
            if (message.includes('closed') || message.includes('rejected')) {
              setFlowError('closed');
            } else if (message.includes('400')) {
              setInputError('Incorrect email format, please review.');
            } else {
              console.error(exception);
              setFlowError('unknown');
              setStatus('error');
            }
          }
        });

        const message = await quoteEmail({
          email: emailInput,
          sessionId,
        });

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [session],
  );

  const handleBackup = useCallback(async () => {
    try {
      if (!backupMessage) {
        throw new Error('No backup message');
      }
      await session.send(backupMessage);
    } catch (exception) {
      const { message } = exceptionToError(exception);
      if (message.includes('closed')) {
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
