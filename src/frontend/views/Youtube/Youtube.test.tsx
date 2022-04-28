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

import { useYoutubeApi } from './useYoutubeApi';
import { Youtube, YoutubeChannel } from './Youtube';

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

const channelMock: YoutubeChannel = {
  name: 'TestUser',
  id: '1234556789',
};

const secret = 'SECRET';
const code = 'CODE';

jest.mock('./useYoutubeApi', () => ({ useYoutubeApi: jest.fn() }));
const mockYoutubeApi: ReturnType<typeof useYoutubeApi> = {
  authUrl: jest.fn(),
  confirm: jest.fn(),
  quote: jest.fn(),
  requestAttestation: jest.fn(),
  attest: jest.fn(),
};
jest.mocked(useYoutubeApi).mockReturnValue(mockYoutubeApi);

async function signInWithYoutube() {
  const signInLink = await screen.findByRole('link', {
    name: 'Sign in with YouTube',
  });
  await userEvent.click(signInLink);
}

async function openYoutube() {
  const openYoutubeLink = await screen.findByRole('link', {
    name: 'Open YouTube',
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

function expectconfirmCalledWith(routeParams: {
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

async function expectStartOver() {
  expect(mockYoutubeApi.authUrl).toHaveBeenCalled();
}

describe('Youtube', () => {
  let authUrlPromise = makeControlledPromise<string>();
  let confirmPromise = makeControlledPromise<YoutubeChannel>();
  let quotePromise = makeControlledPromise<IEncryptedMessage>();
  let sendPromise = makeControlledPromise<void>();
  let requestPromise = makeControlledPromise<Record<string, never>>();
  let attestPromise = makeControlledPromise<IEncryptedMessage>();

  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    authUrlPromise = makeControlledPromise<string>();
    jest
      .mocked(mockYoutubeApi.authUrl)
      .mockReset()
      .mockReturnValue(authUrlPromise.promise);

    confirmPromise = makeControlledPromise<YoutubeChannel>();
    jest
      .mocked(mockYoutubeApi.confirm)
      .mockReset()
      .mockReturnValue(confirmPromise.promise);

    quotePromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockYoutubeApi.quote)
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
      .mocked(mockYoutubeApi.requestAttestation)
      .mockReset()
      .mockReturnValue(requestPromise.promise);

    attestPromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockYoutubeApi.attest)
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

  it('should go through the happy path until redirected to Youtube', async () => {
    render(<Youtube session={sessionMock} />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.resolve('https://youtube-auth-url.example');
    });

    await signInWithYoutube();
    expect(await screen.findByText('Sign in with YouTube')).toBeInTheDocument();
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
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.youtubeAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Youtube session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

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
          paths.youtubeAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Youtube session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);

    expectconfirmCalledWith({ secret, code });

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

  it.only('should show no channel error', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.youtubeAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Youtube session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);

    expectconfirmCalledWith({ secret, code });

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
    expect(await screen.findByText('Open YouTube')).toBeInTheDocument();
  });

  it('should show error when quote fails', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.youtubeAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Youtube session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

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
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.youtubeAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Youtube session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.resolve(channelMock);
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
          paths.youtubeAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Youtube session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

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
          paths.youtubeAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Youtube session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

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
    expect(mockYoutubeApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    const { container } = render(
      <MemoryRouter
        initialEntries={[
          paths.youtubeAuth.replace(':secret', secret).replace(':code', code),
        ]}
      >
        <Youtube session={sessionMock} />
      </MemoryRouter>,
    );

    expectIsNotProcessing(container);
    expectconfirmCalledWith({ secret, code });

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
