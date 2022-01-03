import { Meta } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { TwitterTemplate } from './TwitterTemplate';

export default {
  title: 'Views/Twitter',
  component: TwitterTemplate,
} as Meta;

const actions = {
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
  setInputError: action('setInputError'),
};

export function Start(): JSX.Element {
  return <TwitterTemplate status="none" processing={false} {...actions} />;
}

export function Requested(): JSX.Element {
  return <TwitterTemplate status="requested" processing={true} {...actions} />;
}

export function Confirming(): JSX.Element {
  return (
    <TwitterTemplate
      status="confirming"
      secret="0123456789"
      processing={false}
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
      status="requested"
      flowError="closed"
      processing={false}
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
      {...actions}
    />
  );
}

export function Unconfirmed(): JSX.Element {
  return (
    <TwitterTemplate status="unconfirmed" processing={false} {...actions} />
  );
}
