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
  name: 'TestUser',
  id: '1234556789',
};

export function Start(): JSX.Element {
  return <YoutubeTemplate status="none" processing={false} {...actions} />;
}

export function UrlReady(): JSX.Element {
  return <YoutubeTemplate status="urlReady" processing={false} {...actions} />;
}

export function Authorizing(): JSX.Element {
  return (
    <YoutubeTemplate status="authorizing" processing={false} {...actions} />
  );
}

export function Authorized(): JSX.Element {
  return (
    <YoutubeTemplate
      status="authorized"
      processing={false}
      channel={channelMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <YoutubeTemplate
      status="authorized"
      processing={true}
      channel={channelMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return <YoutubeTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready(): JSX.Element {
  return <YoutubeTemplate status="ready" processing={false} {...actions} />;
}

export function UnexpectedError(): JSX.Element {
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

export function Closed(): JSX.Element {
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

export function Unauthorized(): JSX.Element {
  return (
    <YoutubeTemplate
      status="error"
      processing={false}
      flowError="unauthorized"
      {...actions}
    />
  );
}

export function NoChannel(): JSX.Element {
  return (
    <YoutubeTemplate
      status="error"
      processing={false}
      flowError="noChannel"
      {...actions}
    />
  );
}
