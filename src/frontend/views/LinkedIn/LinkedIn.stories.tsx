import { Meta } from '@storybook/react';

import { action } from '@storybook/addon-actions';

import { LinkedInTemplate } from './LinkedInTemplate';
import { LinkedInProfile } from './LinkedIn';

export default {
  title: 'Views/LinkedIn',
  component: LinkedInTemplate,
} as Meta;

const actions = {
  handleSignInClick: action('Sign in'),
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
};

const profileMock: LinkedInProfile = {
  id: '1234556789',
  localizedFirstName: 'John',
  localizedLastName: 'Doe',
};

export function Start(): JSX.Element {
  return <LinkedInTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady(): JSX.Element {
  return <LinkedInTemplate status="urlReady" processing={false} {...actions} />;
}

export function Authorizing(): JSX.Element {
  return (
    <LinkedInTemplate status="authorizing" processing={false} {...actions} />
  );
}

export function Authorized(): JSX.Element {
  return (
    <LinkedInTemplate
      status="authorized"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <LinkedInTemplate
      status="authorized"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return (
    <LinkedInTemplate status="attesting" processing={false} {...actions} />
  );
}

export function Ready(): JSX.Element {
  return <LinkedInTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError(): JSX.Element {
  return (
    <LinkedInTemplate
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
    <LinkedInTemplate
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
    <LinkedInTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}
