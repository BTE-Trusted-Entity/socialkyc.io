import { Fragment } from 'react';

import { Session } from '../../utilities/session';
import { OAuthTemplate } from '../../components/OAuthTemplate/OAuthTemplate';
import { useOAuthState } from '../../components/OAuthTemplate/useOAuthState';
import backgroundImage from '../Attester/discord.svg';

import { useDiscordApi } from './useDiscordApi';

export interface DiscordProfile {
  Username: string;
  Discriminator: string;
  'User ID': string;
}

interface Props {
  session: Session;
}

export function Discord({ session }: Props): JSX.Element {
  const discordApi = useDiscordApi(session.sessionId);

  const {
    status,
    processing,
    handleSubmit,
    handleBackup,
    handleTryAgainClick,
    authUrl,
    profile,
    flowError,
  } = useOAuthState<DiscordProfile>({
    session,
    getAuthUrl: discordApi.authUrl,
    getProfile: discordApi.confirm,
    requestAttestation: discordApi.requestAttestation,
    quote: discordApi.quote,
    attest: discordApi.attest,
  });

  return (
    <OAuthTemplate
      service="Discord"
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
            <dd>
              {profile.Username}#{profile.Discriminator}
            </dd>
          </Fragment>
        )
      }
      flowError={flowError}
    />
  );
}
