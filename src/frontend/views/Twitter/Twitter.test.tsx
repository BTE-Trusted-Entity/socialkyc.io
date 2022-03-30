// expect cannot be imported because of https://github.com/testing-library/jest-dom/issues/426
import { afterEach, beforeEach, describe, it, jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { act, render, screen } from '../../../testing/testing';
import '../../components/useCopyButton/useCopyButton.mock';
import { Session } from '../../utilities/session';
import { makeControlledPromise } from '../../../backend/utilities/makeControlledPromise';

import { useTwitterApi } from './useTwitterApi';
import { Twitter } from './Twitter';

const sessionMock: Session = {
  encryptionKeyId: 'encryptionKeyId',
  encryptedChallenge: 'encryptedChallenge',
  nonce: 'nonce',
  send: jest.fn(),
  close: jest.fn(),
  listen: jest.fn(),
  sessionId: 'foo',
  name: 'foo bar',
};

jest.mock('./useTwitterApi', () => ({ useTwitterApi: jest.fn() }));
const mockTwitterApi: ReturnType<typeof useTwitterApi> = {
  quote: jest.fn(),
  requestAttestation: jest.fn(),
  attest: jest.fn(),
  confirm: jest.fn(),
};
jest.mocked(useTwitterApi).mockReturnValue(mockTwitterApi);

async function enterTwitter() {
  const input = await screen.findByLabelText('Your Twitter handle');
  await userEvent.type(input, 'social_kyc_tech');
}

function expectQuoteRequested() {
  expect(mockTwitterApi.quote).toHaveBeenCalledWith({
    username: 'social_kyc_tech',
  });
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

describe('Twitter', () => {
  let quotePromise = makeControlledPromise<IEncryptedMessage>();
  let sendPromise = makeControlledPromise<void>();
  let requestPromise = makeControlledPromise<{ secret: string }>();
  let confirmPromise = makeControlledPromise<undefined>();
  let attestPromise = makeControlledPromise<IEncryptedMessage>();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    sendPromise = makeControlledPromise<void>();
    jest
      .mocked(sessionMock.send)
      .mockReset()
      .mockReturnValue(sendPromise.promise);
    jest.mocked(sessionMock.listen).mockReset();

    quotePromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockTwitterApi.quote)
      .mockReset()
      .mockReturnValue(quotePromise.promise);

    requestPromise = makeControlledPromise<{ secret: string }>();
    jest
      .mocked(mockTwitterApi.requestAttestation)
      .mockReset()
      .mockReturnValue(requestPromise.promise);

    confirmPromise = makeControlledPromise<undefined>();
    jest
      .mocked(mockTwitterApi.confirm)
      .mockReset()
      .mockReturnValue(confirmPromise.promise);

    attestPromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockTwitterApi.attest)
      .mockReset()
      .mockReturnValue(attestPromise.promise);
  });

  afterEach(() => {
    jest.mocked(console.error).mockRestore();
  });

  async function respondWithQuote() {
    await act(async () => {
      quotePromise.resolve({ quote: '' } as unknown as IEncryptedMessage);
    });
  }

  async function confirmOwnership() {
    await act(async () => {
      confirmPromise.resolve(undefined);
    });
  }

  it('should go through the happy path', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    await enterTwitter();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ signed: 'quote' });
    expectAttestationRequested();

    await act(async () => {
      requestPromise.resolve({ secret: 'SECRET' });
    });
    expectIsNotProcessing(container);

    await expectSecretInMessage();
    await confirmOwnership();
    await expectAnchoringInProgress();

    await act(async () => {
      attestPromise.resolve({ done: '' } as unknown as IEncryptedMessage);
    });
    expect(await screen.findByText('Credential is ready')).toBeInTheDocument();

    await act(async () => {
      await listenerPromise;
      sendPromise.resolve(undefined);
    });

    await userEvent.click(
      await screen.findByRole('button', { name: 'Show credential in wallet' }),
    );
    expect(sessionMock.send).toHaveBeenCalledWith({ done: '' });
  });

  it('should show error when quote fails', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    await enterTwitter();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await act(async () => {
      quotePromise.reject(new Error());
    });
    expect(sessionMock.send).not.toHaveBeenCalled();

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    expect(mockTwitterApi.quote).toHaveBeenCalledTimes(1);
    await tryAgain();
    await continueInWallet();
    expect(mockTwitterApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should show an error when the wallet communication fails', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    await enterTwitter();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    await act(async () => {
      sendPromise.reject(new Error('closed'));
    });

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    await tryAgain();
    await continueInWallet();
    expect(mockTwitterApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should show an error when there’s an error in Sporran', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    await enterTwitter();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ error: 'unknown' });
    expect(mockTwitterApi.requestAttestation).toHaveBeenCalledWith({
      message: { error: 'unknown' },
    });

    await act(async () => {
      requestPromise.reject(new Error('unknown'));
      await listenerPromise;
      sendPromise.resolve(undefined);
    });

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    await tryAgain();
    await continueInWallet();
    expect(mockTwitterApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice when the popup is closed', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    await enterTwitter();
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
      requestPromise.reject(new Error('closed'));
      await listenerPromise;
      sendPromise.resolve(undefined);
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

  it('should show an error when the username is invalid', async () => {
    const { container } = render(<Twitter session={sessionMock} />);

    const input = await screen.findByLabelText('Your Twitter handle');
    await userEvent.type(input, 'social_ kyc_tech');
    await continueInWallet();

    expectIsNotProcessing(container);
    expect(
      await screen.findByText(
        'There is an unexpected character „ “, please correct.',
      ),
    ).toBeInTheDocument();
  });

  it('should advice about the slow confirmation', async () => {
    jest.useFakeTimers();

    const { container } = render(<Twitter session={sessionMock} />);

    await enterTwitter();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    callSessionListenerWith({ signed: 'quote' });
    expectAttestationRequested();

    await act(async () => {
      requestPromise.resolve({ secret: 'SECRET' });
    });
    expectIsNotProcessing(container);
    await expectSecretInMessage();

    jest.runAllTimers();

    expect(await screen.findByText('Tweet not found')).toBeInTheDocument();

    await tryAgain();
    await continueInWallet();
    expect(mockTwitterApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    jest.useFakeTimers();

    const { container } = render(<Twitter session={sessionMock} />);

    await enterTwitter();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    callSessionListenerWith({ signed: 'quote' });
    expectAttestationRequested();

    await act(async () => {
      requestPromise.resolve({ secret: 'SECRET' });
    });
    expectIsNotProcessing(container);
    await expectSecretInMessage();

    await confirmOwnership();
    await expectAnchoringInProgress();

    jest.runAllTimers();

    expect(
      await screen.findByText('Anchoring is taking longer than expected.'),
    ).toBeInTheDocument();
  });
});
