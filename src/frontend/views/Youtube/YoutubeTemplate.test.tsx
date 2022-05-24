// expect cannot be imported because of https://github.com/testing-library/jest-dom/issues/426
import { describe, it, jest } from '@jest/globals';

import { render } from '../../../testing/testing';

import { YoutubeTemplate } from './YoutubeTemplate';
import { YoutubeChannel } from './Youtube';

jest.useFakeTimers();
jest.setSystemTime(new Date('2022-01-03T12:00:00'));

const actions = {
  handleSignInClick: jest.fn(),
  handleSubmit: jest.fn(),
  handleBackup: jest.fn(),
  handleTryAgainClick: jest.fn(),
};

const channelMock: YoutubeChannel = {
  name: 'TestUser',
  id: '1234556789',
};

describe('YoutubeTemplate', () => {
  it('should match snapshot with status=none', async () => {
    const { container } = render(
      <YoutubeTemplate status="none" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=urlReady', async () => {
    const { container } = render(
      <YoutubeTemplate status="urlReady" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authorizing', async () => {
    const { container } = render(
      <YoutubeTemplate status="authorizing" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authorized', async () => {
    const { container } = render(
      <YoutubeTemplate
        status="authorized"
        processing={false}
        channel={channelMock}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=attesting', async () => {
    const { container } = render(
      <YoutubeTemplate status="attesting" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=ready', async () => {
    const { container } = render(
      <YoutubeTemplate status="ready" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowerror=unauthorized', async () => {
    const { container } = render(
      <YoutubeTemplate
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
      <YoutubeTemplate
        status="authorized"
        flowError="closed"
        processing={false}
        channel={channelMock}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=unknown', async () => {
    const { container } = render(
      <YoutubeTemplate
        status="error"
        flowError="unknown"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=noChannel', async () => {
    const { container } = render(
      <YoutubeTemplate
        status="error"
        flowError="noChannel"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
