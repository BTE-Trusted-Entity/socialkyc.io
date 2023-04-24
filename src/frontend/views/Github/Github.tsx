import { Fragment } from 'react';

import { Session } from '../../utilities/session';
import { OAuthTemplate } from '../../components/OAuthTemplate/OAuthTemplate';
import { useOAuthState } from '../../components/OAuthTemplate/useOAuthState';
import backgroundImage from '../Attester/github.svg';

import { useGithubApi } from './useGithubApi';

export interface GithubProfile {
  Username: string;
  'User ID': string;
}

interface Props {
  session: Session;
}

export function Github({ session }: Props): JSX.Element {
  const githubApi = useGithubApi(session.sessionId);

  const {
    status,
    processing,
    handleSubmit,
    handleBackup,
    handleTryAgainClick,
    authUrl,
    profile,
    flowError,
  } = useOAuthState<GithubProfile>({
    session,
    getAuthUrl: githubApi.authUrl,
    getProfile: githubApi.confirm,
    requestAttestation: githubApi.requestAttestation,
    quote: githubApi.quote,
    attest: githubApi.attest,
  });

  return (
    <OAuthTemplate
      service="GitHub"
      backgroundImage={backgroundImage}
      status={status}
      processing={processing}
      handleSubmit={handleSubmit}
      handleBackup={handleBackup}
      handleTryAgainClick={handleTryAgainClick}
      authUrl={authUrl}
      profile={
        profile && (
          <Fragment>
            <dt>User-ID:</dt>
            <dd>{profile['User ID']}</dd>

            <dt>Username:</dt>
            <dd>{profile.Username}</dd>
          </Fragment>
        )
      }
      flowError={flowError}
    />
  );
}
