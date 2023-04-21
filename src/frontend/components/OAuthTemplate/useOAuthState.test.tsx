// expect cannot be imported because of https://github.com/testing-library/jest-dom/issues/426
import { afterEach, beforeEach, describe, it, jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { IEncryptedMessage } from '@kiltprotocol/sdk-js';

import {
  act,
  makeTestPromise,
  render,
  screen,
  TestPromise,
} from '../../../testing/testing';
import '../useCopyButton/useCopyButton.mock';
import {
  sessionMock,
  sessionMockReset,
  sessionMockSendPromise,
} from '../../utilities/session.mock';
import { ClosedRejection } from '../../utilities/session';
import { useValuesFromRedirectUri } from '../../utilities/useValuesFromRedirectUri';

import { useOAuthState } from './useOAuthState';
import { OAuthTemplate } from './OAuthTemplate';

interface Profile {
  'User ID': string;
}

const profileMock: Profile = {
  'User ID': '1234556789',
};

const secret = 'SECRET';
const code = 'CODE';

jest.mock('../../utilities/useValuesFromRedirectUri');

let TestComponent: () => JSX.Element;
let authUrlPromise: TestPromise<string>;
let confirmPromise: TestPromise<Profile>;
let quotePromise: TestPromise<IEncryptedMessage>;
let requestPromise: TestPromise<void>;
let attestPromise: TestPromise<IEncryptedMessage>;

async function signInWithIt() {
  const signInLink = await screen.findByRole('link', {
    name: 'Sign in with TestOAuth',
  });
  await userEvent.click(signInLink);
}

function expectQuoteRequested() {
  expect(quotePromise.jestFn).toHaveBeenCalledWith({});
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
  expect(authUrlPromise.jestFn).toHaveBeenCalledWith({});
}

function expectConfirmCalledWith(routeParams: {
  secret: string;
  code: string;
}) {
  expect(confirmPromise.jestFn).toHaveBeenCalledWith(routeParams);
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
  expect(requestPromise.jestFn).toHaveBeenCalledWith({
    message: { signed: 'quote' },
  });
}

function expectStartOver() {
  expect(authUrlPromise.jestFn).toHaveBeenCalled();
}

async function respondWithQuote() {
  await act(async () => {
    quotePromise.resolve({ quote: '' } as unknown as IEncryptedMessage);
  });
}

describe('useOAuthState', () => {
  beforeEach(() => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({});

    authUrlPromise = makeTestPromise();
    confirmPromise = makeTestPromise();
    quotePromise = makeTestPromise();
    requestPromise = makeTestPromise();
    attestPromise = makeTestPromise();

    sessionMockReset();

    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    TestComponent = function TestComponent() {
      const {
        status,
        processing,
        handleSubmit,
        handleBackup,
        handleTryAgainClick,
        authUrl,
        profile,
        flowError,
      } = useOAuthState<Profile>({
        session: sessionMock,
        getAuthUrl: authUrlPromise.jestFn,
        getProfile: confirmPromise.jestFn,
        requestAttestation: requestPromise.jestFn,
        quote: quotePromise.jestFn,
        attest: attestPromise.jestFn,
      });

      return (
        <OAuthTemplate
          service="TestOAuth"
          status={status}
          processing={processing}
          handleSubmit={handleSubmit}
          handleBackup={handleBackup}
          handleTryAgainClick={handleTryAgainClick}
          authUrl={authUrl}
          profile={profile && <p>User-ID: {profile['User ID']}</p>}
          flowError={flowError}
        />
      );
    };
  });

  afterEach(() => {
    jest.mocked(console.error).mockRestore();
  });

  it('should go through the happy path until redirected to it', async () => {
    render(<TestComponent />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.resolve('https://auth-url.example');
    });

    await signInWithIt();
    expect(
      await screen.findByText('Sign in with TestOAuth'),
    ).toBeInTheDocument();
  });

  it('should show an error when authUrl fails', async () => {
    render(<TestComponent />);

    expectAuthUrlCalled();

    await act(async () => {
      authUrlPromise.reject(new Error());
    });

    await expectSomethingWrong();

    expect(authUrlPromise.jestFn).toHaveBeenCalledTimes(1);
    await tryAgain();
    expect(authUrlPromise.jestFn).toHaveBeenCalledTimes(2);
  });

  it('should finish the happy path after authorization', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<TestComponent />);

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

    const { container } = render(<TestComponent />);

    expectIsNotProcessing(container);

    expectConfirmCalledWith({ secret, code });

    await act(async () => {
      confirmPromise.reject(new Error('authorization'));
    });

    expect(
      await screen.findByText(
        'There was an error authorizing your TestOAuth account.',
      ),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Continue in Wallet' }),
    ).not.toBeInTheDocument();

    await tryAgain();
    expectStartOver();
  });

  it('should show error when quote fails', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<TestComponent />);

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
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<TestComponent />);

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

    const { container } = render(<TestComponent />);

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
      sessionMockSendPromise.resolve(undefined);
    });

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    await tryAgain();
    expectStartOver();
  });

  it('should advice when the popup is closed', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<TestComponent />);

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
    expect(requestPromise.jestFn).toHaveBeenCalledWith({
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
    expect(quotePromise.jestFn).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret, code });

    const { container } = render(<TestComponent />);

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
