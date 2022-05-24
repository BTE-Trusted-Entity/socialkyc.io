import { Meta } from '@storybook/react';

import { action } from '@storybook/addon-actions';

import { InstagramTemplate } from './InstagramTemplate';
import { InstagramProfile } from './Instagram';

export default {
  title: 'Views/Instagram',
  component: InstagramTemplate,
} as Meta;

const actions = {
  handleSignInClick: action('Sign in'),
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
};

const profileMock: InstagramProfile = {
  id: '123456789',
  username: 'john_doe',
  account_type: 'PERSONAL',
};

export function Start(): JSX.Element {
  return <InstagramTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady(): JSX.Element {
  return (
    <InstagramTemplate status="urlReady" processing={false} {...actions} />
  );
}

export function Authorizing(): JSX.Element {
  return (
    <InstagramTemplate status="authorizing" processing={false} {...actions} />
  );
}

export function Authorized(): JSX.Element {
  return (
    <InstagramTemplate
      status="authorized"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <InstagramTemplate
      status="authorized"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return (
    <InstagramTemplate status="attesting" processing={false} {...actions} />
  );
}

export function Ready(): JSX.Element {
  return <InstagramTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError(): JSX.Element {
  return (
    <InstagramTemplate
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
    <InstagramTemplate
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
    <InstagramTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}
