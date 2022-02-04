import { Meta } from '@storybook/react';

import { action } from '@storybook/addon-actions';

import { DiscordTemplate } from './DiscordTemplate';
import { DiscordProfile } from './Discord';

export default {
  title: 'Views/Discord',
  component: DiscordTemplate,
} as Meta;

const actions = {
  handleSignInClick: action('Sign in'),
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
};

const profileMock: DiscordProfile = {
  username: 'TestUser',
  discriminator: '1234',
  id: '1234556789',
};

export function Start(): JSX.Element {
  return <DiscordTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady(): JSX.Element {
  return <DiscordTemplate status="urlReady" processing={false} {...actions} />;
}

export function Authorizing(): JSX.Element {
  return (
    <DiscordTemplate status="authorizing" processing={false} {...actions} />
  );
}

export function Authorized(): JSX.Element {
  return (
    <DiscordTemplate
      status="authorized"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <DiscordTemplate
      status="authorized"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return <DiscordTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready(): JSX.Element {
  return <DiscordTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError(): JSX.Element {
  return (
    <DiscordTemplate
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
    <DiscordTemplate
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
    <DiscordTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}
