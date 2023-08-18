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
  Email: 'user@example.com',
};

export function Start() {
  return <EmailTemplate status="none" processing={false} {...actions} />;
}

export function EmailSent() {
  return <EmailTemplate status="emailSent" processing={false} {...actions} />;
}

export function Authenticating() {
  return (
    <EmailTemplate status="authenticating" processing={false} {...actions} />
  );
}

export function Authenticated() {
  return (
    <EmailTemplate
      status="authenticated"
      processing={false}
      profile={profileMock}
      {...actions}
    />
  );
}

export function QuoteOpen() {
  return (
    <EmailTemplate
      status="authenticated"
      processing={true}
      profile={profileMock}
      {...actions}
    />
  );
}

export function Attesting() {
  return <EmailTemplate status="attesting" processing={false} {...actions} />;
}

export function Ready() {
  return <EmailTemplate status="ready" processing={false} {...actions} />;
}

export function Expired() {
  return (
    <EmailTemplate
      status="error"
      flowError="expired"
      processing={false}
      {...actions}
    />
  );
}

export function Closed() {
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

export function UnexpectedError() {
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
