// expect cannot be imported because of https://github.com/testing-library/jest-dom/issues/426
import { describe, it, jest } from '@jest/globals';

import { render } from '../../../testing/testing';
import '../../components/useCopyButton/useCopyButton.mock';

import { EmailTemplate } from './EmailTemplate';
import { EmailProfile } from './Email';

jest.useFakeTimers();
jest.setSystemTime(new Date('2022-01-03T12:00:00'));

const actions = {
  handleSendEmail: jest.fn(),
  handleRequestAttestation: jest.fn(),
  handleBackup: jest.fn(),
  handleTryAgainClick: jest.fn(),
  setInputError: jest.fn(),
};

const profileMock: EmailProfile = {
  email: 'user@example.com',
};

describe('EmailTemplate', () => {
  it('should match snapshot with status=none', async () => {
    const { container } = render(
      <EmailTemplate status="none" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=emailSent', async () => {
    const { container } = render(
      <EmailTemplate status="emailSent" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authorizing', async () => {
    const { container } = render(
      <EmailTemplate status="authorizing" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authorized', async () => {
    const { container } = render(
      <EmailTemplate
        status="authorized"
        processing={false}
        profile={profileMock}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=attesting', async () => {
    const { container } = render(
      <EmailTemplate status="attesting" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=ready', async () => {
    const { container } = render(
      <EmailTemplate status="ready" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowerror=expired', async () => {
    const { container } = render(
      <EmailTemplate
        status="error"
        flowError="expired"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=closed', async () => {
    const { container } = render(
      <EmailTemplate
        status="none"
        flowError="closed"
        processing={false}
        profile={profileMock}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=unknown', async () => {
    const { container } = render(
      <EmailTemplate
        status="error"
        flowError="unknown"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
