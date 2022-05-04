import { describe, it, jest, expect } from '@jest/globals';

import { render } from '../../../testing/testing';
import '../../components/useCopyButton/useCopyButton.mock';

import { TwitterTemplate } from './TwitterTemplate';

jest.useFakeTimers();
jest.setSystemTime(new Date('2022-01-03T12:00:00'));

const actions = {
  handleSubmit: jest.fn(),
  handleBackup: jest.fn(),
  handleTryAgainClick: jest.fn(),
  setInputError: jest.fn(),
};

describe('TwitterTemplate', () => {
  it('should match snapshot with status=none', async () => {
    const { container } = render(
      <TwitterTemplate status="none" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=requested', async () => {
    const { container } = render(
      <TwitterTemplate status="requested" processing={true} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=confirming', async () => {
    const { container } = render(
      <TwitterTemplate
        status="confirming"
        secret="0123456789"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=attesting', async () => {
    const { container } = render(
      <TwitterTemplate status="attesting" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=ready', async () => {
    const { container } = render(
      <TwitterTemplate status="ready" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=closed', async () => {
    const { container } = render(
      <TwitterTemplate
        status="requested"
        flowError="closed"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=unknown', async () => {
    const { container } = render(
      <TwitterTemplate
        status="error"
        flowError="unknown"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=unconfirmed', async () => {
    const { container } = render(
      <TwitterTemplate status="unconfirmed" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });
});
