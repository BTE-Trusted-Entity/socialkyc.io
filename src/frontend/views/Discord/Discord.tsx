import { useState, useEffect, useMemo, useCallback, FormEvent } from 'react';

import { useRouteMatch } from 'react-router-dom';

import { IEncryptedMessage } from '@kiltprotocol/types';

import { Session } from '../../utilities/session';

import { paths } from '../../paths';

import { exceptionToError } from '../../utilities/exceptionToError';

import {
  AttestationStatus,
  DiscordTemplate,
  FlowError,
} from './DiscordTemplate';
import { useDiscordApi } from './useDiscordApi';

export interface DiscordProfile {
  id: string;
  username: string;
}

interface Props {
  session: Session;
}

export function Discord({ session }: Props): JSX.Element {
  const match = useRouteMatch(paths.discordAuth)?.params as {
    code?: string;
    secret?: string;
  };
  // useRouteMatch by default returns a new object on each render
  const params = useMemo(() => {
    return { code: match?.code, secret: match?.secret };
  }, [match?.code, match?.secret]);

  const { code, secret } = params;

  const initialStatus = code && secret ? 'authorizing' : 'none';

  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const discordApi = useDiscordApi(session.sessionId);

  const [authUrl, setAuthUrl] = useState('');

  const [profile, setProfile] = useState<DiscordProfile>();

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  useEffect(() => {
    if (status !== 'none') {
      return;
    }
    (async () => {
      try {
        const url = await discordApi.authUrl({});
        setAuthUrl(url);
        setStatus('urlReady');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [status, discordApi]);

  useEffect(() => {
    if (!code || !secret) {
      return;
    }
    (async () => {
      try {
        setProfile(await discordApi.authConfirm({ code, secret }));
        setStatus('authorized');
      } catch {
        setStatus('error');
        setFlowError('unauthorized');
      }
    })();
  }, [discordApi, code, secret]);

  const handleSignInClick = useCallback(() => {
    setStatus('authorizing');
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setFlowError(undefined);
      try {
        await session.listen(async (message) => {
          try {
            await discordApi.requestAttestation({ message });
            setStatus('attesting');
            setProcessing(false);

            setBackupMessage(await discordApi.attest({}));
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

        if (!profile) {
          throw new Error('No Discord profile');
        }

        const message = await discordApi.quote(profile);

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [discordApi, session, profile],
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
    <DiscordTemplate
      status={status}
      processing={processing}
      handleSignInClick={handleSignInClick}
      handleSubmit={handleSubmit}
      handleBackup={handleBackup}
      handleTryAgainClick={handleTryAgainClick}
      authUrl={authUrl}
      profile={profile}
      flowError={flowError}
    />
  );
}
