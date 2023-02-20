// expect cannot be imported because of https://github.com/testing-library/jest-dom/issues/426
import { afterEach, beforeEach, describe, it, jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { IEncryptedMessage } from '@kiltprotocol/types';

import {
  act,
  makeTestPromise,
  render,
  screen,
  TestPromise,
} from '../../../testing/testing';
import '../../components/useCopyButton/useCopyButton.mock';
import {
  sessionMock,
  sessionMockReset,
  sessionMockSendPromise,
} from '../../utilities/session.mock';
import { ClosedRejection } from '../../utilities/session';
import { useValuesFromRedirectUri } from '../../utilities/useValuesFromRedirectUri';

import { useYoutubeApi } from './useYoutubeApi';
import { Youtube, YoutubeChannel } from './Youtube';

const channelMock: YoutubeChannel = {
  'Channel Name': 'TestUser',
  'Channel ID': '1234556789',
};

const secret = 'SECRET';
const code = 'CODE';

jest.mock('../../utilities/useValuesFromRedirectUri');

jest.mock('./useYoutubeApi');
let mockYoutubeApi: ReturnType<typeof useYoutubeApi>;
let authUrlPromise: TestPromise<string>;
let confirmPromise: TestPromise<YoutubeChannel>;
let quotePromise: TestPromise<IEncryptedMessage>;
let requestPromise: TestPromise<void>;
let attestPromise: TestPromise<IEncryptedMessage>;

async function signInWithYoutube() {
  const signInLink = await screen.findByRole('link', {
    name: 'Sign-in with Youtube',
  });
  await userEvent.click(signInLink);
}

async function openYoutube() {
  const openYoutubeLink = await screen.findByRole('link', {
    name: 'Open Youtube',
  });
  await userEvent.click(openYoutubeLink);
}

function expectQuoteRequested() {
  expect(mockYoutubeApi.quote).toHaveBeenCalledWith({});
}

async function continueInWallet() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Continue in Wallet' }),
  );
}

function callSessionListenerWith(input: unknown) {
  expect(sessionMock.listen).toHaveBeenCalled();
  const listener = jest.mocked(sessionMock.listen).mock.calls[0][0] as (
    input: unknown,
  ) => Promise<unknown>;
  return listener(input);
}

function expectIsProcessing(container: HTMLElement) {
  expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
}

function expectIsNotProcessing(container: HTMLElement) {
  expect(container.firstElementChild).toHaveAttribute('aria-busy', 'false');
}

async function expectSomethingWrong() {
  expect(await screen.findByText('Something went wrong!')).toBeInTheDocument();
}

function expectAuthUrlCalled() {
  expect(mockYoutubeApi.authUrl).toHaveBeenCalledWith({});
}

function expectConfirmCalledWith(routeParams: {
  secret: string;
  code: string;
}) {
  expect(mockYoutubeApi.confirm).toHaveBeenCalledWith(routeParams);
}

function expectQuoteIsSent() {
  expect(sessionMock.send).toHaveBeenCalledWith({ quote: '' });
}

async function expectAnchoringInProgress() {
  expect(
    await screen.findByText('Anchoring credential on KILT blockchain'),
  ).toBeInTheDocument();
}

async function tryAgain() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Try again' }),
  );
}

function expectAttestationRequested() {
  expect(mockYoutubeApi.requestAttestation).toHaveBeenCalledWith({
    message: { signed: 'quote' },
  });
}

function expectStartOver() {
  expect(mockYoutubeApi.authUrl).toHaveBeenCalled();
}

async function respondWithQuote() {
  await act(async () => {
    quotePromise.resolve({ quote: '' } as unknown as IEncryptedMessage);
  });
}

describe('Youtube', () => {
  beforeEach(() => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({});

    authUrlPromise = makeTestPromise();
    confirmPromise = makeTestPromise();
    quotePromise = makeTestPromise();
    requestPromise = makeTestPromise();
    attestPromise = makeTestPromise();

    mockYoutubeApi = {
      authUrl: authUrlPromise.jestFn,
      confirm: confirmPromise.jestFn,
      quote: quotePromise.jestFn,
      requestAttestation: requestPromise.jestFn,
      attest: attestPromise.jestFn,
    };
    jest.mocked(useYoutubeApi).mockReturnValue(mockYoutubeApi);

    sessionMockReset();

    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.mocked(console.error).mockRestore();
  });

  it('should go through the happy path until redirected to Youtube', async () => {
    render(<Youtube session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.resolve('https://youtube-auth-url.example');
    });
    await signInWithYoutube();

    expect(await screen.findByText('Sign-in with')).toBeInTheDocument();
  });

  it('should show an error when authUrl fails', async () => {
    render(<Youtube session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.reject(new Error());
    });

    await expectSomethingWrong();

    expect(mockYoutubeApi.authUrl).toHaveBeenCalledTimes(1);
    await tryAgain();
    expect(mockYoutubeApi.authUrl).toHaveBeenCalledTimes(2);
  });

  it('should finish the happy path after authorization', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<Youtube session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(channelMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ signed: 'quote' });
    expectAttestationRequested();

    await act(async () => {
      requestPromise.resolve();
    });
    expectIsNotProcessing(container);
    await expectAnchoringInProgress();

    await act(async () => {
      attestPromise.resolve({ done: '' } as unknown as IEncryptedMessage);
    });
    expect(await screen.findByText('Credential is ready')).toBeInTheDocument();

    await act(async () => {
      await listenerPromise;
      sessionMockSendPromise.resolve(undefined);
    });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Show credential in wallet' }),
    );
    expect(sessionMock.send).toHaveBeenCalledWith({ done: '' });
  });

  it('should show authorization error', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<Youtube session={sessionMock} />);

    expectIsNotProcessing(container);

    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.reject(new Error('authorization'));
    });

    expect(
      await screen.findByText(
        'There was an error authorizing your YouTube channel.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Continue in Wallet' }),
    ).not.toBeInTheDocument();

    await tryAgain();
    expectStartOver();
  });

  it('should show no channel error', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<Youtube session={sessionMock} />);

    expectIsNotProcessing(container);

    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.reject(new Error('No channels'));
    });

    expect(
      await screen.findByText(
        'No YouTube channel could be found associated with your YouTube account.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Continue in Wallet' }),
    ).not.toBeInTheDocument();

    await openYoutube();
    expect(await screen.findByText('Open')).toBeInTheDocument();
  });

  it('should show error when quote fails', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<Youtube session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(channelMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await act(async () => {
      quotePromise.reject(new Error());
    });
    expect(sessionMock.send).not.toHaveBeenCalled();

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    await tryAgain();
    expectStartOver();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should show an error when the wallet communication fails', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<Youtube session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(channelMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();
    await act(async () => {
      sessionMockSendPromise.reject(new Error('closed'));
    });

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    await tryAgain();
    expectStartOver();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should show an error when there’s an error in Sporran', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<Youtube session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(channelMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ error: 'unknown' });

    await act(async () => {
      requestPromise.reject(new Error('unknown'));
      await listenerPromise;
      sessionMockSendPromise.resolve(undefined);
    });

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    await tryAgain();
    expectStartOver();
  });

  it('should advice when the popup is closed', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<Youtube session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(channelMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ popup: 'closed' });
    expect(mockYoutubeApi.requestAttestation).toHaveBeenCalledWith({
      message: { popup: 'closed' },
    });

    await act(async () => {
      requestPromise.reject(new ClosedRejection());
      await listenerPromise;
      sessionMockSendPromise.resolve(undefined);
    });

    expectIsNotProcessing(container);
    expect(
      await screen.findByText(
        'Your wallet was closed before the request was signed.',
      ),
    ).toBeInTheDocument();

    await continueInWallet();
    expect(mockYoutubeApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<Youtube session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(channelMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    jest.useFakeTimers();
    callSessionListenerWith({ signed: 'quote' });
    expectAttestationRequested();

    await act(async () => {
      requestPromise.resolve();
    });
    expectIsNotProcessing(container);
    await expectAnchoringInProgress();

    jest.runAllTimers();

    expect(
      await screen.findByText('Anchoring is taking longer than expected.'),
    ).toBeInTheDocument();
  });
});
