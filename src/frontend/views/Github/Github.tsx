import { FormEvent, useCallback, useEffect, useState } from 'react';

import { IEncryptedMessage } from '@kiltprotocol/types';

import { Rejection, Session } from '../../utilities/session';
import { useValuesFromRedirectUri } from '../../utilities/useValuesFromRedirectUri';

import { AttestationStatus, FlowError, GithubTemplate } from './GithubTemplate';
import { useGithubApi } from './useGithubApi';

export interface GithubProfile {
  login: string;
  id: string;
}

interface Props {
  session: Session;
}

export function Github({ session }: Props): JSX.Element {
  const { code, secret } = useValuesFromRedirectUri();
  const initialStatus = code && secret ? 'authorizing' : 'none';

  const [flowError, setFlowError] = useState<FlowError>();
  const [status, setStatus] = useState<AttestationStatus>(initialStatus);
  const [processing, setProcessing] = useState(false);

  const githubApi = useGithubApi(session.sessionId);

  const [authUrl, setAuthUrl] = useState('');

  const [profile, setProfile] = useState<GithubProfile>();

  const [backupMessage, setBackupMessage] = useState<IEncryptedMessage>();

  useEffect(() => {
    if (status !== 'none') {
      return;
    }
    (async () => {
      try {
        // step 1): POST to /api/github/authUrl to get OAuth url including a secret, which creates a new secret in the backend (and sets session.secret). Will be exposed as a clickable link in the UI. 
        const url = await githubApi.authUrl({});
        setAuthUrl(url);
        setStatus('urlReady');
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      }
    })();
  }, [status, githubApi]);

  useEffect(() => {
    if (!code || !secret) {
      return;
    }
    (async () => {
      try {
        // step 2): User clicked link and completed OAuth, being redirected back to SPA. Redirect link contains 'code' & 'secret'. We are in a new session now!
        // POST request to /api/github/confirm with { code, secret } results in backend fetching user data (stored in 'claim' on the new session) and setting 'confirmed' to true. The 'secret' is deleted from the backend. Returns profile info for display in frontend.
        setProfile(await githubApi.confirm({ code, secret }));
        setStatus('authorized');
      } catch {
        setStatus('error');
        setFlowError('unauthorized');
      }
    })();
  }, [githubApi, code, secret]);

  const handleSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      setProcessing(true);
      setFlowError(undefined);
      try {
        await session.listen(async (message) => {
          try {
            // step 4): if sporran answers with a request for attestation, POST it to /api/github/request-attestation. After checking that the claim in request == claim in the quote, this sets 'requestForAttestation' on the session. 
            await githubApi.requestAttestation({ message });
            setStatus('attesting');
            setProcessing(false);

            // step 5): after request is accepted above, we trigger attestation by POST to /api/github/attest, which sets 'attestationPromise' on the session, and after resolution, deletes 'claim', 'requestForAttestation', and 'confirmed'. The HTTP response after resolution contains a submit-attestation message.
            setBackupMessage(await githubApi.attest({}));
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

        // step 3): after user clicked 'Continue in Wallet', we POST to /api/github/quote (empty body & no parameters) to request a quote from the backend to forward to sporran. The claim to populate the quote is recovered from the session.
        const message = await githubApi.quote({});

        // quote message is pushed to sporran.
        await session.send(message);
      } catch (error) {
        console.error(error);
        setStatus('error');
        setFlowError('unknown');
      } finally {
        setProcessing(false);
      }
    },
    [githubApi, session],
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
    <GithubTemplate
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
