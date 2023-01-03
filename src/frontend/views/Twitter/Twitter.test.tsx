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

import { useTwitterApi } from './useTwitterApi';
import { Twitter, TwitterProfile } from './Twitter';

const profileMock: TwitterProfile = {
  twitterHandle: 'social_kyc_tech',
};

const secret = 'SECRET';

jest.mock('./useTwitterApi');
let mockTwitterApi: ReturnType<typeof useTwitterApi>;
let claimPromise: TestPromise<string>;
let confirmPromise: TestPromise<TwitterProfile>;
let quotePromise: TestPromise<IEncryptedMessage>;
let requestPromise: TestPromise<void>;
let attestPromise: TestPromise<IEncryptedMessage>;

async function enterTwitter() {
  const input = await screen.findByLabelText('Your Twitter handle');
  await userEvent.type(input, 'social_kyc_tech');
}

async function clickContinue() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Continue' }),
  );
}

function expectClaimCalled() {
  expect(mockTwitterApi.claim).toHaveBeenCalledWith({
    twitterHandle: 'social_kyc_tech',
  });
}

function expectQuoteRequested() {
  expect(mockTwitterApi.quote).toHaveBeenCalledWith({});
}

async function continueInWallet() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Continue in wallet' }),
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

async function expectStartOver() {
  expect(
    await screen.findByLabelText('Your Twitter handle'),
  ).toBeInTheDocument();
}

async function expectSecretInMessage() {
  const messageOutput = (await screen.findByLabelText(
    'Please tweet this message:',
  )) as HTMLTextAreaElement;
  expect(messageOutput.value).toContain('SECRET');
}

function expectAttestationRequested() {
  expect(mockTwitterApi.requestAttestation).toHaveBeenCalledWith({
    message: { signed: 'quote' },
  });
}

async function respondWithQuote() {
  await act(async () => {
    quotePromise.resolve({ quote: '' } as unknown as IEncryptedMessage);
  });
}

async function confirmOwnership() {
  await act(async () => {
    confirmPromise.resolve(profileMock);
  });
}

describe('Twitter', () => {
  beforeEach(() => {
    claimPromise = makeTestPromise();
    confirmPromise = makeTestPromise();
    quotePromise = makeTestPromise();
    requestPromise = makeTestPromise();
    attestPromise = makeTestPromise();

    mockTwitterApi = {
      claim: claimPromise.jestFn,
      confirm: confirmPromise.jestFn,
      quote: quotePromise.jestFn,
      requestAttestation: requestPromise.jestFn,
      attest: attestPromise.jestFn,
    };
    jest.mocked(useTwitterApi).mockReturnValue(mockTwitterApi);

    sessionMockReset();

    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.mocked(console.error).mockRestore();
  });

  it('should go through the happy path', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterTwitter();
    await clickContinue();
    expectIsProcessing(container);

    expectClaimCalled();

    await act(async () => {
      claimPromise.resolve(secret);
    });

    expectIsNotProcessing(container);

    expectSecretInMessage();

    expect(await screen.findByText('Go to Twitter')).toBeInTheDocument();

    await confirmOwnership();

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

  it('should show an error when the username is invalid', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    const input = await screen.findByLabelText('Your Twitter handle');
    await userEvent.type(input, 'social_ kyc_tech');
    await clickContinue();

    expectIsNotProcessing(container);
    expect(
      await screen.findByText(
        'There is an unexpected character „ “, please correct.',
      ),
    ).toBeInTheDocument();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should show an error when claim fails', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterTwitter();
    await clickContinue();
    expectIsProcessing(container);

    expectClaimCalled();

    await act(async () => {
      claimPromise.reject(new Error());
    });

    expectIsNotProcessing(container);

    expectSomethingWrong();

    await tryAgain();
    await expectStartOver();
    await clickContinue();

    expect(mockTwitterApi.claim).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow confirmation', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterTwitter();
    await clickContinue();

    jest.useFakeTimers();

    expectIsProcessing(container);

    expectClaimCalled();

    await act(async () => {
      claimPromise.resolve(secret);
    });

    expectIsNotProcessing(container);

    expectSecretInMessage();

    jest.runAllTimers();

    expect(await screen.findByText('Tweet not found')).toBeInTheDocument();

    jest.useRealTimers();

    await tryAgain();
    await expectStartOver();
  });

  it('should show error when quote fails', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterTwitter();
    await clickContinue();
    expectIsProcessing(container);

    expectClaimCalled();

    await act(async () => {
      claimPromise.resolve(secret);
    });

    expectIsNotProcessing(container);

    expectSecretInMessage();

    expect(await screen.findByText('Go to Twitter')).toBeInTheDocument();

    await confirmOwnership();

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
    await expectStartOver();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should show an error when the wallet communication fails', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterTwitter();
    await clickContinue();
    expectIsProcessing(container);

    expectClaimCalled();

    await act(async () => {
      claimPromise.resolve(secret);
    });

    expectIsNotProcessing(container);

    expectSecretInMessage();

    expect(await screen.findByText('Go to Twitter')).toBeInTheDocument();

    await confirmOwnership();

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
    await expectStartOver();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should show an error when there’s an error in Sporran', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterTwitter();
    await clickContinue();
    expectIsProcessing(container);

    expectClaimCalled();

    await act(async () => {
      claimPromise.resolve(secret);
    });

    expectIsNotProcessing(container);

    expectSecretInMessage();

    expect(await screen.findByText('Go to Twitter')).toBeInTheDocument();

    await confirmOwnership();

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
    await expectStartOver();
  });

  it('should advice when the popup is closed', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterTwitter();
    await clickContinue();
    expectIsProcessing(container);

    expectClaimCalled();

    await act(async () => {
      claimPromise.resolve(secret);
    });

    expectIsNotProcessing(container);

    expectSecretInMessage();

    expect(await screen.findByText('Go to Twitter')).toBeInTheDocument();

    await confirmOwnership();

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ popup: 'closed' });
    expect(mockTwitterApi.requestAttestation).toHaveBeenCalledWith({
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
    expect(mockTwitterApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterTwitter();
    await clickContinue();
    expectIsProcessing(container);

    expectClaimCalled();

    await act(async () => {
      claimPromise.resolve(secret);
    });

    expectIsNotProcessing(container);

    expectSecretInMessage();

    expect(await screen.findByText('Go to Twitter')).toBeInTheDocument();

    await confirmOwnership();

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
