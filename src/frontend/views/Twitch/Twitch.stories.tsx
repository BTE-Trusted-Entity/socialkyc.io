import { Meta } from '@storybook/react';

import { action } from '@storybook/addon-actions';

import { TwitchTemplate } from './TwitchTemplate';
import { TwitchProfile } from './Twitch';

export default {
  title: 'Views/Twitch',
  component: TwitchTemplate,
} as Meta;

const actions = {
  handleSignInClick: action('Sign in'),
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
};

const profileMock: TwitchProfile = {
  Username: 'TestUser',
  'User ID': '1234556789',
};

export function Start(): JSX.Element {
  return <TwitchTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady(): JSX.Element {
  return <TwitchTemplate status="urlReady" processing={false} {...actions} />;
}

export function Authorizing(): JSX.Element {
  return (
    <TwitchTemplate status="authorizing" processing={false} {...actions} />
  );
}

export function Authorized(): JSX.Element {
  return (
    <TwitchTemplate
      status="authorized"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <TwitchTemplate
      status="authorized"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return <TwitchTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready(): JSX.Element {
  return <TwitchTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError(): JSX.Element {
  return (
    <TwitchTemplate
      status="error"
      processing={false}
      flowError="unknown"
      profile={profileMock}
      {...actions}
    />
  );
}

export function Closed(): JSX.Element {
  return (
    <TwitchTemplate
      status="authorized"
      processing={false}
      flowError="closed"
      profile={profileMock}
      {...actions}
    />
  );
}

export function Unauthorized(): JSX.Element {
  return (
    <TwitchTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}
