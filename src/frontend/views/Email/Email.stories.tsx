import { Meta } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import { EmailTemplate } from './EmailTemplate';
import { EmailProfile } from './Email';

export default {
  title: 'Views/Email',
  component: EmailTemplate,
} as Meta;

const actions = {
  handleSendEmail: action('sendEmail'),
  handleRequestAttestation: action('requestAttestation'),
  handleBackup: action('backup'),
  handleTryAgainClick: action('tryAgain'),
  setInputError: action('setInputError'),
};

const profileMock: EmailProfile = {
  email: 'user@example.com',
};

export function Start(): JSX.Element {
  return <EmailTemplate status="none" processing={false} {...actions} />;
}

export function EmailSent(): JSX.Element {
  return <EmailTemplate status="emailSent" processing={false} {...actions} />;
}

export function Authenticating(): JSX.Element {
  return (
    <EmailTemplate status="authenticating" processing={false} {...actions} />
  );
}

export function Authenticated(): JSX.Element {
  return (
    <EmailTemplate
      status="authenticated"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen(): JSX.Element {
  return (
    <EmailTemplate
      status="authenticated"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting(): JSX.Element {
  return <EmailTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready(): JSX.Element {
  return <EmailTemplate status="ready" processing={false} {...actions} />;
}

export function Expired(): JSX.Element {
  return (
    <EmailTemplate
      status="error"
      flowError="expired"
      processing={false}
      {...actions}
    />
  );
}

export function Closed(): JSX.Element {
  return (
    <EmailTemplate
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
    <EmailTemplate
      status="error"
      flowError="unknown"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}
