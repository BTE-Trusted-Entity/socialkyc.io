import { Meta } from '@storybook/react';
import { Fragment } from 'react';

import { action } from '@storybook/addon-actions';

import backgroundImage from '../../views/Attester/twitch.svg';

import { OAuthTemplate } from './OAuthTemplate';

export default {
  title: 'Components/OAuthTemplate',
  component: OAuthTemplate,
} as Meta;

const actions = {
  service: 'Twitch',
  backgroundImage,
  handleSignInClick: action('Sign in'),
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
};

const profileMock = (
  <Fragment>
    <dt>User-ID:</dt>
    <dd>1234556789</dd>

    <dt>Username:</dt>
    <dd>TestUser</dd>
  </Fragment>
);

export function Start(): JSX.Element {
  return <OAuthTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady(): JSX.Element {
  return <OAuthTemplate status="urlReady" processing={false} {...actions} />;
}

export function AuthUrlLoader(): JSX.Element {
  return (
    <OAuthTemplate
      status="urlReady"
      processing={false}
      {...actions}
      authUrlLoader={<iframe>Test iframe</iframe>}
    />
  );
}

export function Authorizing(): JSX.Element {
  return <OAuthTemplate status="authorizing" processing={false} {...actions} />;
}

export function Authorized(): JSX.Element {
  return (
    <OAuthTemplate
      status="authorized"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <OAuthTemplate
      status="authorized"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return <OAuthTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready(): JSX.Element {
  return <OAuthTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError(): JSX.Element {
  return (
    <OAuthTemplate
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
    <OAuthTemplate
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
    <OAuthTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}
