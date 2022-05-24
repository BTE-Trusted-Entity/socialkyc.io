import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { Rejection, Session } from '../../utilities/session';

import {
  AttestationStatus,
  FlowError,
  TelegramTemplate,
} from './TelegramTemplate';
import { useTelegramApi } from './useTelegramApi';
import { useAuthData } from './useAuthData';

export interface TelegramProfile {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface Props {
  session: Session;
}

export function Telegram({ session }: Props): JSX.Element {
  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>('none');
  const [processing, setProcessing] = useState(false);

  const telegramApi = useTelegramApi(session.sessionId);

  const [authUrl, setAuthUrl] = useState('');

  const [profile, setProfile] = useState<TelegramProfile>();

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  useEffect(() => {
    if (status !== 'none') {
      return;
    }
    (async () => {
      try {
        const url = await telegramApi.authUrl({});
        setAuthUrl(url);
        setStatus('urlReady');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [status, telegramApi]);

  const authData = useAuthData();
  useEffect(() => {
    (async () => {
      if (!authData) {
        return;
      }

      try {
        setStatus('authorizing');
        setProfile(await telegramApi.confirm({ json: authData }));
        setStatus('authorized');
      } catch {
        setStatus('error');
        setFlowError('unauthorized');
      }
    })();
  }, [authData, telegramApi]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setFlowError(undefined);
      try {
        await session.listen(async (message) => {
          try {
            await telegramApi.requestAttestation({ message });
            setStatus('attesting');
            setProcessing(false);

            setBackupMessage(await telegramApi.attest({}));
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

        const message = await telegramApi.quote({});

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [telegramApi, session],
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
    <TelegramTemplate
      status={status}
      processing={processing}
      handleSubmit={handleSubmit}
      handleBackup={handleBackup}
      handleTryAgainClick={handleTryAgainClick}
      authUrl={authUrl}
      profile={profile}
      flowError={flowError}
    />
  );
}
