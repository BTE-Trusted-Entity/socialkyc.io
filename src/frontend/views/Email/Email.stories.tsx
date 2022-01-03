import { Meta } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { EmailTemplate } from './EmailTemplate';

export default {
  title: 'Views/Email',
  component: EmailTemplate,
} as Meta;

const actions = {
  handleSubmit: action('submit'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
  setInputError: action('setInputError'),
};

export function Start(): JSX.Element {
  return <EmailTemplate status="none" processing={false} {...actions} />;
}

export function Requested(): JSX.Element {
  return <EmailTemplate status="requested" processing={true} {...actions} />;
}

export function Attesting(): JSX.Element {
  return <EmailTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready(): JSX.Element {
  return <EmailTemplate status="ready" processing={false} {...actions} />;
}

export function Closed(): JSX.Element {
  return (
    <EmailTemplate
      status="requested"
      flowError="closed"
      processing={false}
      {...actions}
    />
  );
}

export function UnexpectedError(): JSX.Element {
  return (
    <EmailTemplate
      status="error"
      flowError="unknown"
      processing={false}
      {...actions}
    />
  );
}
