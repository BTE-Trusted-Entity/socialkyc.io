import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IEncryptedMessage } from '@kiltprotocol/sdk-js';

import { Rejection, Session } from '../../utilities/session';
import { useValuesFromRedirectUri } from '../../utilities/useValuesFromRedirectUri';

import { AttestationStatus, FlowError } from './OAuthTemplate';

export function useOAuthState<Profile>({
  session,
  getAuthUrl,
  getProfile,
  requestAttestation,
  attest,
  quote,
}: {
  session: Session;
  getAuthUrl({}: Record<string, never>): Promise<string>;
  attest({}: Record<string, never>): Promise<IEncryptedMessage>;
  quote({}: Record<string, never>): Promise<IEncryptedMessage>;
  requestAttestation({
    message,
  }: {
    message: IEncryptedMessage;
  }): Promise<void>;
  getProfile({
    code,
    secret,
  }: {
    code: string;
    secret: string;
  }): Promise<unknown>;
}) {
  const { code, secret } = useValuesFromRedirectUri();
  const initialStatus = code && secret ? 'authorizing' : 'none';

  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const [authUrl, setAuthUrl] = useState('');

  const [profile, setProfile] = useState<Profile>();

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  useEffect(() => {
    if (status !== 'none') {
      return;
    }
    (async () => {
      try {
        const url = await getAuthUrl({});
        setAuthUrl(url);
        setStatus('urlReady');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [status, getAuthUrl]);

  useEffect(() => {
    if (!code || !secret) {
      return;
    }
    (async () => {
      try {
        setProfile((await getProfile({ code, secret })) as Profile);
        setStatus('authorized');
      } catch {
        setStatus('error');
        setFlowError('unauthorized');
      }
    })();
  }, [getProfile, code, secret]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setFlowError(undefined);
      try {
        await session.listen(async (message) => {
          try {
            await requestAttestation({ message });
            setStatus('attesting');
            setProcessing(false);

            setBackupMessage(await attest({}));
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

        const message = await quote({});

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [attest, quote, requestAttestation, session],
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

  return {
    status,
    processing,
    handleSubmit,
    handleBackup,
    handleTryAgainClick,
    authUrl,
    profile,
    flowError,
  };
}
