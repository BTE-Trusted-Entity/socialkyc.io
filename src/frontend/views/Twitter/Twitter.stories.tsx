import { Meta } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { TwitterTemplate } from './TwitterTemplate';
import { TwitterProfile } from './Twitter';

export default {
  title: 'Views/Twitter',
  component: TwitterTemplate,
} as Meta;

const actions = {
  handleClaim: action('claim'),
  handleRequestAttestation: action('requestAttestation'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
  setInputError: action('setInputError'),
};

const profileMock: TwitterProfile = {
  Twitter: 'social_kyc_tech',
};

export function Start() {
  return <TwitterTemplate status="none" processing={false} {...actions} />;
}

export function Authenticating() {
  return (
    <TwitterTemplate
      status="authenticating"
      secret="0123456789"
      processing={false}
      {...actions}
    />
  );
}

export function Authenticated() {
  return (
    <TwitterTemplate
      status="authenticated"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen() {
  return (
    <TwitterTemplate
      status="authenticated"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting() {
  return <TwitterTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready() {
  return <TwitterTemplate status="ready" processing={false} {...actions} />;
}

export function Closed() {
  return (
    <TwitterTemplate
      status="authenticated"
      flowError="closed"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function UnexpectedError() {
  return (
    <TwitterTemplate
      status="error"
      flowError="unknown"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Timeout() {
  return (
    <TwitterTemplate
      status="error"
      flowError="timeout"
      processing={false}
      {...actions}
    />
  );
}
