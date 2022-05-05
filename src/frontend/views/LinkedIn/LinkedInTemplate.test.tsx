// expect cannot be imported because of https://github.com/testing-library/jest-dom/issues/426
import { describe, it, jest } from '@jest/globals';

import { render } from '../../../testing/testing';

import { LinkedInTemplate } from './LinkedInTemplate';
import { LinkedInProfile } from './LinkedIn';

jest.useFakeTimers();
jest.setSystemTime(new Date('2022-01-03T12:00:00'));

const actions = {
  handleSignInClick: jest.fn(),
  handleSubmit: jest.fn(),
  handleBackup: jest.fn(),
  handleTryAgainClick: jest.fn(),
};

const profileMock: LinkedInProfile = {
  id: '1234556789',
  localizedFirstName: 'John',
  localizedLastName: 'Doe',
};

describe('LinkedInTemplate', () => {
  it('should match snapshot with status=none', async () => {
    const { container } = render(
      <LinkedInTemplate status="none" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=urlReady', async () => {
    const { container } = render(
      <LinkedInTemplate status="urlReady" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authorizing', async () => {
    const { container } = render(
      <LinkedInTemplate status="authorizing" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authorized', async () => {
    const { container } = render(
      <LinkedInTemplate
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
      <LinkedInTemplate status="attesting" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=ready', async () => {
    const { container } = render(
      <LinkedInTemplate status="ready" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowerror=unauthorized', async () => {
    const { container } = render(
      <LinkedInTemplate
        status="error"
        flowError="unauthorized"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=closed', async () => {
    const { container } = render(
      <LinkedInTemplate
        status="authorized"
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
      <LinkedInTemplate
        status="error"
        flowError="unknown"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
