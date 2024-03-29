// expect cannot be imported because of https://github.com/testing-library/jest-dom/issues/426
import { describe, it, jest } from '@jest/globals';

import { render } from '../../../testing/testing';

import { OAuthTemplate } from './OAuthTemplate';

jest.useFakeTimers();
jest.setSystemTime(new Date('2022-01-03T12:00:00'));

const actions = {
  service: 'TestOAuth',
  handleSignInClick: jest.fn(),
  handleSubmit: jest.fn(),
  handleBackup: jest.fn(),
  handleTryAgainClick: jest.fn(),
};

const profileMock = <p>User-ID: 1234556789</p>;

describe('OAuthTemplate', () => {
  it('should match snapshot with status=none', async () => {
    const { container } = render(
      <OAuthTemplate status="none" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=none for loader', async () => {
    const { container } = render(
      <OAuthTemplate
        status="none"
        processing={false}
        {...actions}
        authUrlLoader={<iframe src="/auth-url" className="iframeLoading" />}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=urlReady', async () => {
    const { container } = render(
      <OAuthTemplate status="urlReady" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=urlReady for loader', async () => {
    const { container } = render(
      <OAuthTemplate
        status="urlReady"
        processing={false}
        {...actions}
        authUrlLoader={<iframe src="/auth-url" className="iframe" />}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authorizing', async () => {
    const { container } = render(
      <OAuthTemplate status="authorizing" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authorized', async () => {
    const { container } = render(
      <OAuthTemplate
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
      <OAuthTemplate status="attesting" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=ready', async () => {
    const { container } = render(
      <OAuthTemplate status="ready" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowerror=unauthorized', async () => {
    const { container } = render(
      <OAuthTemplate
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
      <OAuthTemplate
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
      <OAuthTemplate
        status="error"
        flowError="unknown"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
