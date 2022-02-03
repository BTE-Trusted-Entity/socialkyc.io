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

import { useDiscordApi } from './useDiscordApi';
import { Discord, DiscordProfile } from './Discord';

const sessionMock: Session = {
  encryptionKeyId: 'encryptionKeyId',
  encryptedChallenge: 'encryptedChallenge',
  nonce: 'nonce',
  send: jest.fn(),
  close: jest.fn(),
  listen: jest.fn(),
  sessionId: 'foo',
};

const profileMock: DiscordProfile = {
  username: 'TestUser',
  discriminator: '1234',
  id: '1234556789',
};

const secret = 'SECRET';
const code = 'CODE';

jest.mock('./useDiscordApi', () => ({ useDiscordApi: jest.fn() }));
const mockDiscordApi: ReturnType<typeof useDiscordApi> = {
  authUrl: jest.fn(),
  confirm: jest.fn(),
  quote: jest.fn(),
  requestAttestation: jest.fn(),
  attest: jest.fn(),
};
jest.mocked(useDiscordApi).mockReturnValue(mockDiscordApi);

async function signInWithDiscord() {
  const signInLink = await screen.findByRole('link', {
    name: 'Sign in with Discord',
  });
  await userEvent.click(signInLink);
}

function expectQuoteRequested() {
  expect(mockDiscordApi.quote).toHaveBeenCalledWith({});
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

// function expectConfirmCalledWith(secret: string) {
//   expect(mockDiscordApi.confirm).toHaveBeenCalledWith({ secret });
// }

function expectAuthUrlCalled() {
  expect(mockDiscordApi.authUrl).toHaveBeenCalledWith({});
}

function expectconfirmCalledWith(routeParams: {
  secret: string;
  code: string;
}) {
  expect(mockDiscordApi.confirm).toHaveBeenCalledWith(routeParams);
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
  userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
}

function expectAttestationRequested() {
  expect(mockDiscordApi.requestAttestation).toHaveBeenCalledWith({
    message: { signed: 'quote' },
  });
}

async function expectStartOver() {
  expect(mockDiscordApi.authUrl).toHaveBeenCalled();
}

describe('Discord', () => {
  let authUrlPromise = makeControlledPromise<string>();
  let confirmPromise = makeControlledPromise<DiscordProfile>();
  let quotePromise = makeControlledPromise<IEncryptedMessage>();
  let sendPromise = makeControlledPromise<void>();
  let requestPromise = makeControlledPromise<Record<string, never>>();
  let attestPromise = makeControlledPromise<IEncryptedMessage>();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    authUrlPromise = makeControlledPromise<string>();
    jest
      .mocked(mockDiscordApi.authUrl)
      .mockReset()
      .mockReturnValue(authUrlPromise.promise);

    confirmPromise = makeControlledPromise<DiscordProfile>();
    jest
      .mocked(mockDiscordApi.confirm)
      .mockReset()
      .mockReturnValue(confirmPromise.promise);

    quotePromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockDiscordApi.quote)
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
      .mocked(mockDiscordApi.requestAttestation)
      .mockReset()
      .mockReturnValue(requestPromise.promise);

    attestPromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockDiscordApi.attest)
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

  it('should go through the happy path until redirected to Discord', async () => {
    render(<Discord session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.resolve('https://discord-auth-url.example');
    });

    await signInWithDiscord();
    expect(await screen.findByText('Sign in with Discord')).toBeInTheDocument();
  });

  it('should show an error when authUrl fails', async () => {
    render(<Discord session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.reject(new Error());
    });

    await expectSomethingWrong();

    expect(mockDiscordApi.authUrl).toHaveBeenCalledTimes(1);
    await tryAgain();
    expect(mockDiscordApi.authUrl).toHaveBeenCalledTimes(2);
  });

  it('should finish the happy path after authorization', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.discordAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Discord session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

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

    userEvent.click(
      await screen.findByRole('button', { name: 'Show credential in wallet' }),
    );
    expect(sessionMock.send).toHaveBeenCalledWith({ done: '' });
  });

  it('should show authorization error', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.discordAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Discord session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);

    expectconfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.reject(new Error('authorization'));
    });

    expect(
      await screen.findByText(
        'There was an error authorizing your Discord account.',
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
          paths.discordAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Discord session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

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
          paths.discordAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Discord session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

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
          paths.discordAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Discord session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

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
          paths.discordAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Discord session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(profileMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ popup: 'closed' });
    expect(mockDiscordApi.requestAttestation).toHaveBeenCalledWith({
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
    expect(mockDiscordApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    jest.useFakeTimers();

    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.discordAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Discord session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(profileMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

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
