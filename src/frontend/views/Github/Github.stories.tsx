import { Meta } from '@storybook/react';

import { action } from '@storybook/addon-actions';

import { GithubTemplate } from './GithubTemplate';
import { GithubProfile } from './Github';

export default {
  title: 'Views/Github',
  component: GithubTemplate,
} as Meta;

const actions = {
  handleSignInClick: action('Sign in'),
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
};

const profileMock: GithubProfile = {
  Username: 'TestUser',
  'User ID': '1234556789',
};

export function Start(): JSX.Element {
  return <GithubTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady(): JSX.Element {
  return <GithubTemplate status="urlReady" processing={false} {...actions} />;
}

export function Authorizing(): JSX.Element {
  return (
    <GithubTemplate status="authorizing" processing={false} {...actions} />
  );
}

export function Authorized(): JSX.Element {
  return (
    <GithubTemplate
      status="authorized"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <GithubTemplate
      status="authorized"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return <GithubTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready(): JSX.Element {
  return <GithubTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError(): JSX.Element {
  return (
    <GithubTemplate
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
    <GithubTemplate
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
    <GithubTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}
