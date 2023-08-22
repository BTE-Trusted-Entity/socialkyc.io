import { describe, it, jest, expect } from '@jest/globals';

import { render } from '../../../testing/testing';

import '../../components/useCopyButton/useCopyButton.mock';
import { TwitterProfile } from './Twitter';

import { TwitterTemplate } from './TwitterTemplate';

jest.useFakeTimers();
jest.setSystemTime(new Date('2022-01-03T12:00:00'));

const actions = {
  handleClaim: jest.fn(),
  handleRequestAttestation: jest.fn(),
  handleBackup: jest.fn(),
  handleTryAgainClick: jest.fn(),
  setInputError: jest.fn(),
};

const profileMock: TwitterProfile = {
  Username: 'social_kyc_tech',
};

const secret = 'SECRET';

describe('TwitterTemplate', () => {
  it('should match snapshot with status=none', async () => {
    const { container } = render(
      <TwitterTemplate status="none" processing={false} {...actions} />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authenticating', async () => {
    const { container } = render(
      <TwitterTemplate
        status="authenticating"
        processing={false}
        secret={secret}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with status=authenticated', async () => {
    const { container } = render(
      <TwitterTemplate
        status="authenticated"
        processing={false}
        profile={profileMock}
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

  it('should match snapshot with flowerror=timeout', async () => {
    const { container } = render(
      <TwitterTemplate
        status="error"
        flowError="timeout"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with flowError=closed', async () => {
    const { container } = render(
      <TwitterTemplate
        status="authenticated"
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
      <TwitterTemplate
        status="error"
        flowError="unknown"
        processing={false}
        {...actions}
      />,
    );
    expect(container).toMatchSnapshot();
  });
});
