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

import { useGithubApi } from './useGithubApi';
import { Github, GithubProfile } from './Github';

const sessionMock: Session = {
  encryptionKeyId: 'encryptionKeyId',
  encryptedChallenge: 'encryptedChallenge',
  nonce: 'nonce',
  send: jest.fn(),
  close: jest.fn(),
  listen: jest.fn(),
  sessionId: 'foo',
};

const profileMock: GithubProfile = {
  login: 'TestUser',
  id: '1234556789',
};

const secret = 'SECRET';
const code = 'CODE';

jest.mock('./useGithubApi', () => ({ useGithubApi: jest.fn() }));
const mockGithubApi: ReturnType<typeof useGithubApi> = {
  authUrl: jest.fn(),
  confirm: jest.fn(),
  quote: jest.fn(),
  requestAttestation: jest.fn(),
  attest: jest.fn(),
};
jest.mocked(useGithubApi).mockReturnValue(mockGithubApi);

async function signInWithGithub() {
  const signInLink = await screen.findByRole('link', {
    name: 'Sign in with Github',
  });
  await userEvent.click(signInLink);
}

function expectQuoteRequested() {
  expect(mockGithubApi.quote).toHaveBeenCalledWith({});
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
  expect(mockGithubApi.authUrl).toHaveBeenCalledWith({});
}

function expectconfirmCalledWith(routeParams: {
  secret: string;
  code: string;
}) {
  expect(mockGithubApi.confirm).toHaveBeenCalledWith(routeParams);
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
  expect(mockGithubApi.requestAttestation).toHaveBeenCalledWith({
    message: { signed: 'quote' },
  });
}

async function expectStartOver() {
  expect(mockGithubApi.authUrl).toHaveBeenCalled();
}

describe('Github', () => {
  let authUrlPromise = makeControlledPromise<string>();
  let confirmPromise = makeControlledPromise<GithubProfile>();
  let quotePromise = makeControlledPromise<IEncryptedMessage>();
  let sendPromise = makeControlledPromise<void>();
  let requestPromise = makeControlledPromise<Record<string, never>>();
  let attestPromise = makeControlledPromise<IEncryptedMessage>();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    authUrlPromise = makeControlledPromise<string>();
    jest
      .mocked(mockGithubApi.authUrl)
      .mockReset()
      .mockReturnValue(authUrlPromise.promise);

    confirmPromise = makeControlledPromise<GithubProfile>();
    jest
      .mocked(mockGithubApi.confirm)
      .mockReset()
      .mockReturnValue(confirmPromise.promise);

    quotePromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockGithubApi.quote)
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
      .mocked(mockGithubApi.requestAttestation)
      .mockReset()
      .mockReturnValue(requestPromise.promise);

    attestPromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockGithubApi.attest)
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

  it('should go through the happy path until redirected to Github', async () => {
    render(<Github session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.resolve('https://github-auth-url.example');
    });

    await signInWithGithub();
    expect(await screen.findByText('Sign in with Github')).toBeInTheDocument();
  });

  it('should show an error when authUrl fails', async () => {
    render(<Github session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.reject(new Error());
    });

    await expectSomethingWrong();

    expect(mockGithubApi.authUrl).toHaveBeenCalledTimes(1);
    await tryAgain();
    expect(mockGithubApi.authUrl).toHaveBeenCalledTimes(2);
  });

  it('should finish the happy path after authorization', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.githubAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Github session={sessionMock} />
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
          paths.githubAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Github session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);

    expectconfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.reject(new Error('authorization'));
    });

    expect(
      await screen.findByText(
        'There was an error authorizing your Github account.',
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
          paths.githubAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Github session={sessionMock} />
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
          paths.githubAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Github session={sessionMock} />
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
          paths.githubAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Github session={sessionMock} />
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
          paths.githubAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Github session={sessionMock} />
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
    expect(mockGithubApi.requestAttestation).toHaveBeenCalledWith({
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
    expect(mockGithubApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    jest.useFakeTimers();

    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.githubAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Github session={sessionMock} />
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
