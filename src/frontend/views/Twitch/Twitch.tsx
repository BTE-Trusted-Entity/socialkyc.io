import { useState, useEffect, useCallback, FormEvent } from 'react';

import { useRouteMatch } from 'react-router-dom';

import { IEncryptedMessage } from '@kiltprotocol/types';

import { Session } from '../../utilities/session';

import { paths } from '../../paths';

import { exceptionToError } from '../../utilities/exceptionToError';

import { AttestationStatus, TwitchTemplate, FlowError } from './TwitchTemplate';
import { useTwitchApi } from './useTwitchApi';

export interface TwitchProfile {
  login: string;
  id: string;
}

interface Props {
  session: Session;
}

export function Twitch({ session }: Props): JSX.Element {
  const { code, secret } = (useRouteMatch(paths.twitchAuth)?.params as {
    code?: string;
    secret?: string;
  }) || { code: undefined, secret: undefined };

  const initialStatus = code && secret ? 'authorizing' : 'none';

  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const twitchApi = useTwitchApi(session.sessionId);

  const [authUrl, setAuthUrl] = useState('');

  const [profile, setProfile] = useState<TwitchProfile>();

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  useEffect(() => {
    if (status !== 'none') {
      return;
    }
    (async () => {
      try {
        const url = await twitchApi.authUrl({});
        setAuthUrl(url);
        setStatus('urlReady');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [status, twitchApi]);

  useEffect(() => {
    if (!code || !secret) {
      return;
    }
    (async () => {
      try {
        setProfile(await twitchApi.confirm({ code, secret }));
        setStatus('authorized');
      } catch {
        setStatus('error');
        setFlowError('unauthorized');
      }
    })();
  }, [twitchApi, code, secret]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setFlowError(undefined);
      try {
        await session.listen(async (message) => {
          try {
            await twitchApi.requestAttestation({ message });
            setStatus('attesting');
            setProcessing(false);

            setBackupMessage(await twitchApi.attest({}));
            setStatus('ready');
          } catch (exception) {
            const { message } = exceptionToError(exception);
            if (message.includes('closed') || message.includes('rejected')) {
              setFlowError('closed');
            } else {
              console.error(exception);
              setFlowError('unknown');
              setStatus('error');
            }
          }
        });

        const message = await twitchApi.quote({});

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [twitchApi, session],
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
    <TwitchTemplate
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
