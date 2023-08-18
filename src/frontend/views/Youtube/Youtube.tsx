import { FormEvent, useCallback, useEffect, useState } from 'react';
import { HTTPError } from 'ky';
import { StatusCodes } from 'http-status-codes';
import { IEncryptedMessage } from '@kiltprotocol/sdk-js';

import { Rejection, Session } from '../../utilities/session';
import { useValuesFromRedirectUri } from '../../utilities/useValuesFromRedirectUri';

import {
  AttestationStatus,
  FlowError,
  YoutubeTemplate,
} from './YoutubeTemplate';
import { useYoutubeApi } from './useYoutubeApi';

export interface YoutubeChannel {
  'Channel Name': string;
  'Channel ID': string;
}

interface Props {
  session: Session;
}

export function Youtube({ session }: Props) {
  const { code, secret } = useValuesFromRedirectUri();
  const initialStatus = code && secret ? 'authorizing' : 'none';

  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const youtubeApi = useYoutubeApi(session.sessionId);

  const [authUrl, setAuthUrl] = useState('');

  const [channel, setChannel] = useState<YoutubeChannel>();

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  useEffect(() => {
    if (status !== 'none') {
      return;
    }
    (async () => {
      try {
        const url = await youtubeApi.authUrl({});
        setAuthUrl(url);
        setStatus('urlReady');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [status, youtubeApi]);

  useEffect(() => {
    if (!code || !secret) {
      return;
    }
    (async () => {
      try {
        setChannel(
          (await youtubeApi.confirm({ code, secret })) as YoutubeChannel,
        );
        setStatus('authorized');
      } catch (exception) {
        if (
          exception instanceof HTTPError &&
          exception.response.status === StatusCodes.NOT_FOUND
        ) {
          setStatus('error');
          setFlowError('noChannel');
        } else {
          console.error(exception);
          setFlowError('unauthorized');
          setStatus('error');
        }
      }
    })();
  }, [youtubeApi, code, secret]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setFlowError(undefined);
      try {
        await session.listen(async (message) => {
          try {
            await youtubeApi.requestAttestation({ message });
            setStatus('attesting');
            setProcessing(false);

            setBackupMessage(await youtubeApi.attest({}));
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

        const message = await youtubeApi.quote({});

        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [youtubeApi, session],
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
    <YoutubeTemplate
      status={status}
      processing={processing}
      handleSubmit={handleSubmit}
      handleBackup={handleBackup}
      handleTryAgainClick={handleTryAgainClick}
      authUrl={authUrl}
      channel={channel}
      flowError={flowError}
    />
  );
}
