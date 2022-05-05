import { useState, useEffect, useCallback, FormEvent } from 'react';

import { useRouteMatch } from 'react-router-dom';

import { IEncryptedMessage } from '@kiltprotocol/types';

import { Session } from '../../utilities/session';

import { paths } from '../../paths';

import { exceptionToError } from '../../utilities/exceptionToError';

import {
  AttestationStatus,
  LinkedInTemplate,
  FlowError,
} from './LinkedInTemplate';
import { useLinkedInApi } from './useLinkedInApi';

export interface LinkedInProfile {
  id: string;
  localizedFirstName: string;
  localizedLastName: string;
}

interface Props {
  session: Session;
}

export function LinkedIn({ session }: Props): JSX.Element {
  const { code, secret } = (useRouteMatch(paths.linkedInAuth)?.params as {
    code?: string;
    secret?: string;
  }) || { code: undefined, secret: undefined };

  const initialStatus = code && secret ? 'authorizing' : 'none';

  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const linkedInApi = useLinkedInApi(session.sessionId);

  const [authUrl, setAuthUrl] = useState('');

  const [profile, setProfile] = useState<LinkedInProfile>();

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  useEffect(() => {
    if (status !== 'none') {
      return;
    }
    (async () => {
      try {
        const url = await linkedInApi.authUrl({});
        setAuthUrl(url);
        setStatus('urlReady');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [status, linkedInApi]);

  useEffect(() => {
    if (!code || !secret) {
      return;
    }
    (async () => {
      try {
        setProfile(await linkedInApi.confirm({ code, secret }));
        setStatus('authorized');
      } catch {
        setStatus('error');
        setFlowError('unauthorized');
      }
    })();
  }, [linkedInApi, code, secret]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setFlowError(undefined);
      try {
        await session.listen(async (message) => {
          try {
            await linkedInApi.requestAttestation({ message });
            setStatus('attesting');
            setProcessing(false);

            setBackupMessage(await linkedInApi.attest({}));
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

        const message = await linkedInApi.quote({});

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [linkedInApi, session],
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
    <LinkedInTemplate
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
