import { Meta } from '@storybook/react';

import { action } from '@storybook/addon-actions';

import { YoutubeTemplate } from './YoutubeTemplate';
import { YoutubeChannel } from './Youtube';

export default {
  title: 'Views/Youtube',
  component: YoutubeTemplate,
} as Meta;

const actions = {
  handleSignInClick: action('Sign in'),
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
};

const channelMock: YoutubeChannel = {
  'Channel Name': 'TestUser',
  'Channel ID': '1234556789',
};

export function Start() {
  return <YoutubeTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady() {
  return <YoutubeTemplate status="urlReady" processing={false} {...actions} />;
}

export function Authorizing() {
  return (
    <YoutubeTemplate status="authorizing" processing={false} {...actions} />
  );
}

export function Authorized() {
  return (
    <YoutubeTemplate
      status="authorized"
      processing={false}
      channel={channelMock}
      {...actions}
    />
  );
}

export function QuoteOpen() {
  return (
    <YoutubeTemplate
      status="authorized"
      processing={true}
      channel={channelMock}
      {...actions}
    />
  );
}

export function Attesting() {
  return <YoutubeTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready() {
  return <YoutubeTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError() {
  return (
    <YoutubeTemplate
      status="error"
      processing={false}
      flowError="unknown"
      channel={channelMock}
      {...actions}
    />
  );
}

export function Closed() {
  return (
    <YoutubeTemplate
      status="authorized"
      processing={false}
      flowError="closed"
      channel={channelMock}
      {...actions}
    />
  );
}

export function Unauthorized() {
  return (
    <YoutubeTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}

export function NoChannel() {
  return (
    <YoutubeTemplate
      status="error"
      processing={false}
      flowError="noChannel"
      {...actions}
    />
  );
}
