import type { IEncryptedMessage } from '@kiltprotocol/extension-api/types';

import { FormEvent, useCallback, useEffect, useState } from 'react';

import { Rejection, Session } from '../../utilities/session';

import { useTwitterApi } from './useTwitterApi';
import {
  AttestationStatus,
  FlowError,
  TwitterTemplate,
} from './TwitterTemplate';

const confirmingTimeout = 2 * 60 * 1000;

export interface TwitterProfile {
  Twitter: string;
}

interface Props {
  session: Session;
}

export function Twitter({ session }: Props) {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<AttestationStatus>('none');
  const [flowError, setFlowError] = useState<FlowError>();
  const [inputError, setInputError] = useState<string>();

  const [secret, setSecret] = useState('');

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  const twitterApi = useTwitterApi(session.sessionId);

  const [profile, setProfile] = useState<TwitterProfile>();

  const handleClaim = useCallback(
    async (event: FormEvent) => {
      try {
        event.preventDefault();
        setProcessing(true);
        setInputError(undefined);
        setFlowError(undefined);

        const formData = new FormData(event.target as HTMLFormElement);
        const twitterHandle = formData.get('twitterHandle') as string;

        const unexpectedCharacter = twitterHandle.trim().match(/[^a-z0-9_]/i);
        if (unexpectedCharacter) {
          setInputError(
            `There is an unexpected character „${unexpectedCharacter[0]}“, please correct.`,
          );
          return;
        }

        const secret = await twitterApi.claim({ twitterHandle });
        setSecret(secret);
        setStatus('authenticating');
        setProcessing(false);

        setProfile(await twitterApi.confirm({}));
        setStatus('authenticated');
      } catch (error) {
        console.error(error);
        setFlowError('unknown');
        setStatus('error');
      } finally {
        setProcessing(false);
      }
    },
    [twitterApi],
  );

  const handleRequestAttestation = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setFlowError(undefined);
      try {
        await session.listen(async (message) => {
          try {
            await twitterApi.requestAttestation({ message });
            setStatus('attesting');
            setProcessing(false);

            setBackupMessage(await twitterApi.attest({}));
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

        const message = await twitterApi.quote({});

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [twitterApi, session],
  );

  const handleBackup = useCallback(async () => {
    if (!backupMessage) {
      return;
    }
    try {
      await session.send(backupMessage);
    } catch (error) {
      console.error(error);
    }
  }, [backupMessage, session]);

  const handleTryAgainClick = useCallback(() => {
    setStatus('none');
    setFlowError(undefined);
    setSecret('');
  }, []);

  useEffect(() => {
    if (status !== 'authenticating') {
      return;
    }
    const timeout = setTimeout(() => {
      setStatus('error');
      setFlowError('timeout');
    }, confirmingTimeout);
    return () => clearTimeout(timeout);
  }, [status]);

  return (
    <TwitterTemplate
      secret={secret}
      status={status}
      processing={processing}
      flowError={flowError}
      inputError={inputError}
      setInputError={setInputError}
      handleBackup={handleBackup}
      handleClaim={handleClaim}
      handleRequestAttestation={handleRequestAttestation}
      handleTryAgainClick={handleTryAgainClick}
      profile={profile}
    />
  );
}
