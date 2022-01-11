import { FormEvent, useCallback, useEffect, useState } from 'react';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { Session } from '../../utilities/session';
import { exceptionToError } from '../../utilities/exceptionToError';

import { useTwitterApi } from './useTwitterApi';
import {
  AttestationStatus,
  FlowError,
  TwitterTemplate,
} from './TwitterTemplate';

const confirmingTimeout = 5 * 60 * 1000;

interface Props {
  session: Session;
}

export function Twitter({ session }: Props): JSX.Element {
  const [processing, setProcessing] = useState(false);
  const [status, setStatus] = useState<AttestationStatus>('none');
  const [flowError, setFlowError] = useState<FlowError>();
  const [inputError, setInputError] = useState<string>();

  const [secret, setSecret] = useState('');

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  const twitterApi = useTwitterApi(session.sessionId);

  const handleSubmit = useCallback(
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

        await session.listen(async (message) => {
          try {
            const { secret } = await twitterApi.requestAttestation({ message });
            setSecret(secret);
            setStatus('confirming');
            setProcessing(false);

            await twitterApi.confirm({});
            setStatus('attesting');

            const attestationMessage = await twitterApi.attest({});
            setBackupMessage(attestationMessage);

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

        const message = await twitterApi.quote({ username: twitterHandle });

        setStatus('requested');
        await session.send(message);
      } catch (error) {
        console.error(error);
        setFlowError('unknown');
        setStatus('error');
      } finally {
        setProcessing(false);
      }
    },
    [session, twitterApi],
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
    if (status !== 'confirming') {
      return;
    }
    const timeout = setTimeout(
      () => setStatus('unconfirmed'),
      confirmingTimeout,
    );
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
      handleSubmit={handleSubmit}
      handleTryAgainClick={handleTryAgainClick}
    />
  );
}
