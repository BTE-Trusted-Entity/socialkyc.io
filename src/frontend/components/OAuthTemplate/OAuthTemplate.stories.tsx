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
  service: 'TestOAuth',
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

export function Start() {
  return <OAuthTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady() {
  return <OAuthTemplate status="urlReady" processing={false} {...actions} />;
}

export function AuthUrlLoader() {
  return (
    <OAuthTemplate
      status="urlReady"
      processing={false}
      {...actions}
      authUrlLoader={<iframe>Test iframe</iframe>}
    />
  );
}

export function Authorizing() {
  return <OAuthTemplate status="authorizing" processing={false} {...actions} />;
}

export function Authorized() {
  return (
    <OAuthTemplate
      status="authorized"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen() {
  return (
    <OAuthTemplate
      status="authorized"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting() {
  return <OAuthTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready() {
  return <OAuthTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError() {
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

export function Closed() {
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

export function Unauthorized() {
  return (
    <OAuthTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}
