// expect cannot be imported because of https://github.com/testing-library/jest-dom/issues/426
import { afterEach, beforeEach, describe, it, jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { IEncryptedMessage } from '@kiltprotocol/types';

import { act, render, screen } from '../../../testing/testing';
import '../../components/useCopyButton/useCopyButton.mock';
import { paths } from '../../paths';
import { Session } from '../../utilities/session';
import { makeControlledPromise } from '../../../backend/utilities/makeControlledPromise';

import { useTwitchApi } from './useTwitchApi';
import { Twitch, TwitchProfile } from './Twitch';

const sessionMock = {
  encryptionKeyId: 'encryptionKeyId',
  encryptedChallenge: 'encryptedChallenge',
  nonce: 'nonce',
  send: jest.fn(),
  close: jest.fn(),
  listen: jest.fn(),
  sessionId: 'foo',
  name: 'foo bar',
} as Session;

const profileMock: TwitchProfile = {
  login: 'TestUser',
  id: '1234556789',
};

const secret = 'SECRET';
const code = 'CODE';

jest.mock('./useTwitchApi', () => ({ useTwitchApi: jest.fn() }));
const mockTwitchApi = {
  authUrl: jest.fn(),
  confirm: jest.fn(),
  quote: jest.fn(),
  requestAttestation: jest.fn(),
  attest: jest.fn(),
} as ReturnType<typeof useTwitchApi>;
jest.mocked(useTwitchApi).mockReturnValue(mockTwitchApi);

async function signInWithTwitch() {
  const signInLink = await screen.findByRole('link', {
    name: 'Sign in with Twitch',
  });
  await userEvent.click(signInLink);
}

function expectQuoteRequested() {
  expect(mockTwitchApi.quote).toHaveBeenCalledWith({});
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
  expect(mockTwitchApi.authUrl).toHaveBeenCalledWith({});
}

function expectConfirmCalledWith(routeParams: {
  secret: string;
  code: string;
}) {
  expect(mockTwitchApi.confirm).toHaveBeenCalledWith(routeParams);
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
  expect(mockTwitchApi.requestAttestation).toHaveBeenCalledWith({
    message: { signed: 'quote' },
  });
}

async function expectStartOver() {
  expect(mockTwitchApi.authUrl).toHaveBeenCalled();
}

describe('Twitch', () => {
  let authUrlPromise = makeControlledPromise<string>();
  let confirmPromise = makeControlledPromise<TwitchProfile>();
  let quotePromise = makeControlledPromise<IEncryptedMessage>();
  let sendPromise = makeControlledPromise<void>();
  let requestPromise = makeControlledPromise<Record<string, never>>();
  let attestPromise = makeControlledPromise<IEncryptedMessage>();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    authUrlPromise = makeControlledPromise<string>();
    jest
      .mocked(mockTwitchApi.authUrl)
      .mockReset()
      .mockReturnValue(authUrlPromise.promise);

    confirmPromise = makeControlledPromise<TwitchProfile>();
    jest
      .mocked(mockTwitchApi.confirm)
      .mockReset()
      .mockReturnValue(confirmPromise.promise);

    quotePromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockTwitchApi.quote)
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
      .mocked(mockTwitchApi.requestAttestation)
      .mockReset()
      .mockReturnValue(requestPromise.promise);

    attestPromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockTwitchApi.attest)
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

  it('should go through the happy path until redirected to Twitch', async () => {
    render(<Twitch session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.resolve('https://twitch-auth-url.example');
    });

    await signInWithTwitch();
    expect(await screen.findByText('Sign in with Twitch')).toBeInTheDocument();
  });

  it('should show an error when authUrl fails', async () => {
    render(<Twitch session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.reject(new Error());
    });

    await expectSomethingWrong();

    expect(mockTwitchApi.authUrl).toHaveBeenCalledTimes(1);
    await tryAgain();
    expect(mockTwitchApi.authUrl).toHaveBeenCalledTimes(2);
  });

  it('should finish the happy path after authorization', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.twitchAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Twitch session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

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
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.twitchAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Twitch session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);

    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.reject(new Error('authorization'));
    });

    expect(
      await screen.findByText(
        'There was an error authorizing your Twitch account.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Continue in Wallet' }),
    ).not.toBeInTheDocument();

    await tryAgain();
    expectStartOver();
  });

  it('should show error when quote fails', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.twitchAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Twitch session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

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
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.twitchAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Twitch session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

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
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.twitchAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Twitch session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

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
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.twitchAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Twitch session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(profileMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ popup: 'closed' });
    expect(mockTwitchApi.requestAttestation).toHaveBeenCalledWith({
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
    expect(mockTwitchApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.twitchAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Twitch session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectConfirmCalledWith({ secret, code });

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
