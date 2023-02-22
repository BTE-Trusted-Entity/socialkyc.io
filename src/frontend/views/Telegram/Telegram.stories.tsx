import { Meta } from '@storybook/react';

import { action } from '@storybook/addon-actions';

import { TelegramTemplate } from './TelegramTemplate';
import { TelegramProfile } from './Telegram';

export default {
  title: 'Views/Telegram',
  component: TelegramTemplate,
} as Meta;

const actions = {
  handleSignInClick: action('Sign in'),
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
};

const profileMock: TelegramProfile = {
  'First name': 'TestUser',
  'User ID': 1234556789,
};

export function Start(): JSX.Element {
  return <TelegramTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady(): JSX.Element {
  return <TelegramTemplate status="urlReady" processing={false} {...actions} />;
}

export function Authorizing(): JSX.Element {
  return (
    <TelegramTemplate status="authorizing" processing={false} {...actions} />
  );
}

export function Authorized(): JSX.Element {
  return (
    <TelegramTemplate
      status="authorized"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <TelegramTemplate
      status="authorized"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return (
    <TelegramTemplate status="attesting" processing={false} {...actions} />
  );
}

export function Ready(): JSX.Element {
  return <TelegramTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError(): JSX.Element {
  return (
    <TelegramTemplate
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
    <TelegramTemplate
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
    <TelegramTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}
