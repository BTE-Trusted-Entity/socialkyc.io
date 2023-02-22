import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { Rejection, Session } from '../../utilities/session';
import { useValuesFromRedirectUri } from '../../utilities/useValuesFromRedirectUri';
import { InvalidEmail } from '../../../backend/email/sendEmailApi';

import { useEmailApi } from './useEmailApi';
import { AttestationStatus, EmailTemplate, FlowError } from './EmailTemplate';

export interface EmailProfile {
  Email: string;
}

interface Props {
  session: Session;
}

export function Email({ session }: Props): JSX.Element {
  const [inputError, setInputError] = useState<string>();

  const { secret } = useValuesFromRedirectUri(true);

  const initialStatus = secret ? 'authenticating' : 'none';

  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const emailApi = useEmailApi(session.sessionId);
  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  const [profile, setProfile] = useState<EmailProfile>();

  useEffect(() => {
    if (!secret) {
      return;
    }
    (async () => {
      try {
        setProfile(await emailApi.confirm({ secret }));
        setStatus('authenticated');
      } catch {
        setStatus('error');
        setFlowError('expired');
      }
    })();
  }, [emailApi, secret]);

  const handleSendEmail = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setInputError(undefined);
      setFlowError(undefined);

      const formData = new FormData(event.target as HTMLFormElement);
      const emailInput = formData.get('email') as string;

      const { wallet } = session;

      try {
        await emailApi.send({ wallet, email: emailInput.trim() });
        setStatus('emailSent');
      } catch (exception) {
        if (exception instanceof InvalidEmail) {
          setInputError('Incorrect email format, please review.');
        } else {
          console.error(exception);
          setFlowError('unknown');
          setStatus('error');
        }
      } finally {
        setProcessing(false);
      }
    },
    [emailApi, session],
  );

  const handleRequestAttestation = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setFlowError(undefined);
      try {
        await session.listen(async (message) => {
          try {
            await emailApi.requestAttestation({ message });
            setStatus('attesting');
            setProcessing(false);

            setBackupMessage(await emailApi.attest({}));
            setStatus('ready');
          } catch (exception) {
            if (exception instanceof Rejection) {
              setFlowError('closed');
            } else {
              console.error(exception);
              setFlowError('unknown');
              setStatus('error');
            }
          }
        });

        const message = await emailApi.quote({});

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
      handleSendEmail={handleSendEmail}
      handleRequestAttestation={handleRequestAttestation}
      handleBackup={handleBackup}
      handleTryAgainClick={handleTryAgainClick}
      profile={profile}
    />
  );
}
