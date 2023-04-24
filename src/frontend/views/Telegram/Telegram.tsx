import { FormEvent, Fragment, useCallback, useEffect, useState } from 'react';
import { IEncryptedMessage } from '@kiltprotocol/sdk-js';

import * as styles from './Telegram.module.css';

import { Rejection, Session } from '../../utilities/session';
import {
  AttestationStatus,
  FlowError,
  OAuthTemplate,
} from '../../components/OAuthTemplate/OAuthTemplate';
import backgroundImage from '../Attester/telegram.svg';

import { useTelegramApi } from './useTelegramApi';
import { useAuthData } from './useAuthData';

export interface TelegramProfile {
  'User ID': number;
  'First name': string;
  'Last name'?: string;
  Username?: string;
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

  const handleLoaded = useCallback(() => setStatus('urlReady'), []);
  const showLoader = ['none', 'urlReady'].includes(status) && authUrl;
  const authUrlLoader = !showLoader ? undefined : (
    <iframe
      src={authUrl}
      className={status === 'urlReady' ? styles.iframe : styles.iframeLoading}
      onLoad={handleLoaded}
    />
  );

  return (
    <OAuthTemplate
      service="Telegram"
      backgroundImage={backgroundImage}
      status={status}
      processing={processing}
      handleSubmit={handleSubmit}
      handleBackup={handleBackup}
      handleTryAgainClick={handleTryAgainClick}
      authUrlLoader={authUrlLoader}
      profile={
        profile && (
          <Fragment>
            <dt>User-ID:</dt>
            <dd>{profile['User ID']}</dd>

            <dt>First name:</dt>
            <dd>{profile['First name']}</dd>

            {profile['Last name'] && (
              <Fragment>
                <dt>Last name:</dt>
                <dd>{profile['Last name']}</dd>
              </Fragment>
            )}

            {profile.Username && (
              <Fragment>
                <dt>Username:</dt>
                <dd>{profile.Username}</dd>
              </Fragment>
            )}
          </Fragment>
        )
      }
      flowError={flowError}
    />
  );
}
