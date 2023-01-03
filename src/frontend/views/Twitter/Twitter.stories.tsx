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
  twitterHandle: 'social_kyc_tech',
};

export function Start(): JSX.Element {
  return <TwitterTemplate status="none" processing={false} {...actions} />;
}

export function Authenticating(): JSX.Element {
  return (
    <TwitterTemplate
      status="authenticating"
      secret="0123456789"
      processing={false}
      {...actions}
    />
  );
}

export function Authenticated(): JSX.Element {
  return (
    <TwitterTemplate
      status="authenticated"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <TwitterTemplate
      status="authenticated"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return <TwitterTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready(): JSX.Element {
  return <TwitterTemplate status="ready" processing={false} {...actions} />;
}

export function Closed(): JSX.Element {
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

export function UnexpectedError(): JSX.Element {
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

export function Timeout(): JSX.Element {
  return (
    <TwitterTemplate
      status="error"
      flowError="timeout"
      processing={false}
      {...actions}
    />
  );
}
