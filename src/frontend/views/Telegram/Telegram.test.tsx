// expect cannot be imported because of https://github.com/testing-library/jest-dom/issues/426
import { afterEach, beforeEach, describe, it, jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { act, render, screen } from '../../../testing/testing';
import '../../components/useCopyButton/useCopyButton.mock';
import { Session } from '../../utilities/session';
import { makeControlledPromise } from '../../../backend/utilities/makeControlledPromise';

import { useTelegramApi } from './useTelegramApi';
import { useAuthData } from './useAuthData';
import { Telegram, TelegramProfile } from './Telegram';

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

const profileMock: TelegramProfile = {
  first_name: 'TestUser',
  id: 1234556789,
};

jest.mock('./useTelegramApi', () => ({ useTelegramApi: jest.fn() }));
const mockTelegramApi: ReturnType<typeof useTelegramApi> = {
  authUrl: jest.fn(),
  confirm: jest.fn(),
  quote: jest.fn(),
  requestAttestation: jest.fn(),
  attest: jest.fn(),
};
jest.mocked(useTelegramApi).mockReturnValue(mockTelegramApi);

jest.mock('./useAuthData');
const authData = '{"auth": "data"}';
jest.mocked(useAuthData).mockReturnValue(authData);

function expectQuoteRequested() {
  expect(mockTelegramApi.quote).toHaveBeenCalledWith({});
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
  expect(mockTelegramApi.authUrl).toHaveBeenCalledWith({});
}

function expectConfirmCalledWith(authData: { json: string }) {
  expect(mockTelegramApi.confirm).toHaveBeenCalledWith(authData);
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
  expect(mockTelegramApi.requestAttestation).toHaveBeenCalledWith({
    message: { signed: 'quote' },
  });
}

async function expectStartOver() {
  expect(mockTelegramApi.authUrl).toHaveBeenCalled();
}

describe('Telegram', () => {
  let authUrlPromise = makeControlledPromise<string>();
  let confirmPromise = makeControlledPromise<TelegramProfile>();
  let quotePromise = makeControlledPromise<IEncryptedMessage>();
  let sendPromise = makeControlledPromise<void>();
  let requestPromise = makeControlledPromise<Record<string, never>>();
  let attestPromise = makeControlledPromise<IEncryptedMessage>();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    authUrlPromise = makeControlledPromise<string>();
    jest
      .mocked(mockTelegramApi.authUrl)
      .mockReset()
      .mockReturnValue(authUrlPromise.promise);

    confirmPromise = makeControlledPromise<TelegramProfile>();
    jest
      .mocked(mockTelegramApi.confirm)
      .mockReset()
      .mockReturnValue(confirmPromise.promise);

    quotePromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockTelegramApi.quote)
      .mockReset()
      .mockReturnValue(quotePromise.promise);

    sendPromise = makeControlledPromise<void>();
    jest
      .mocked(sessionMock.send)
      .mockReset()
      .mockReturnValue(sendPromise.promise);
    jest.mocked(sessionMock.listen).mockReset();

    requestPromise = makeControlledPromise<Record<string, never>>();
    jest
      .mocked(mockTelegramApi.requestAttestation)
      .mockReset()
      .mockReturnValue(requestPromise.promise);

    attestPromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockTelegramApi.attest)
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

  it('should go through the happy path until Telegram is shown', async () => {
    const { container } = render(<Telegram session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.resolve('https://telegram-auth-url.example/');
    });

    const iframe = container.querySelector('iframe');
    expect(iframe).toBeInTheDocument();
    expect(iframe?.src).toEqual('https://telegram-auth-url.example/');
  });

  it('should show an error when authUrl fails', async () => {
    render(<Telegram session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.reject(new Error());
    });

    await expectSomethingWrong();

    expect(mockTelegramApi.authUrl).toHaveBeenCalledTimes(1);
    await tryAgain();
    expect(mockTelegramApi.authUrl).toHaveBeenCalledTimes(2);
  });

  it('should finish the happy path after authorization', async () => {
    const { container } = render(<Telegram session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ json: authData });

    await act(async () => {
      confirmPromise.resolve(profileMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ signed: 'quote' });
    expectAttestationRequested();

    await act(async () => {
      requestPromise.resolve({});
    });
    expectIsNotProcessing(container);
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

  it('should show authorization error', async () => {
    const { container } = render(<Telegram session={sessionMock} />);

    expectIsNotProcessing(container);

    expectConfirmCalledWith({ json: authData });

    await act(async () => {
      confirmPromise.reject(new Error('authorization'));
    });

    expect(
      await screen.findByText(
        'There was an error authorizing your Telegram account.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Continue in Wallet' }),
    ).not.toBeInTheDocument();

    await tryAgain();
    expectStartOver();
  });

  it('should show error when quote fails', async () => {
    const { container } = render(<Telegram session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ json: authData });

    await act(async () => {
      confirmPromise.resolve(profileMock);
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
    const { container } = render(<Telegram session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ json: authData });

    await act(async () => {
      confirmPromise.resolve(profileMock);
    });

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
    expectStartOver();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should show an error when there’s an error in Sporran', async () => {
    const { container } = render(<Telegram session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ json: authData });

    await act(async () => {
      confirmPromise.resolve(profileMock);
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
      sendPromise.resolve(undefined);
    });

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    await tryAgain();
    expectStartOver();
  });

  it('should advice when the popup is closed', async () => {
    const { container } = render(<Telegram session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ json: authData });

    await act(async () => {
      confirmPromise.resolve(profileMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ popup: 'closed' });
    expect(mockTelegramApi.requestAttestation).toHaveBeenCalledWith({
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
    expect(mockTelegramApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    const { container } = render(<Telegram session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ json: authData });

    await act(async () => {
      confirmPromise.resolve(profileMock);
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
      requestPromise.resolve({});
    });
    expectIsNotProcessing(container);
    await expectAnchoringInProgress();

    jest.runAllTimers();

    expect(
      await screen.findByText('Anchoring is taking longer than expected.'),
    ).toBeInTheDocument();
  });
});
