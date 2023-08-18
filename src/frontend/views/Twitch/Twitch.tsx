import { Fragment } from 'react';

import { Session } from '../../utilities/session';
import { OAuthTemplate } from '../../components/OAuthTemplate/OAuthTemplate';
import { useOAuthState } from '../../components/OAuthTemplate/useOAuthState';
import backgroundImage from '../Attester/twitch.svg';

import { useTwitchApi } from './useTwitchApi';

export interface TwitchProfile {
  Username: string;
  'User ID': string;
}

interface Props {
  session: Session;
}

export function Twitch({ session }: Props) {
  const twitchApi = useTwitchApi(session.sessionId);

  const {
    status,
    processing,
    handleSubmit,
    handleBackup,
    handleTryAgainClick,
    authUrl,
    profile,
    flowError,
  } = useOAuthState<TwitchProfile>({
    session,
    getAuthUrl: twitchApi.authUrl,
    getProfile: twitchApi.confirm,
    requestAttestation: twitchApi.requestAttestation,
    quote: twitchApi.quote,
    attest: twitchApi.attest,
  });

  return (
    <OAuthTemplate
      service="Twitch"
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
