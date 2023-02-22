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
import { InvalidEmail } from '../../../backend/email/sendEmailApi';
import { useValuesFromRedirectUri } from '../../utilities/useValuesFromRedirectUri';

import { useEmailApi } from './useEmailApi';
import { Email, EmailProfile } from './Email';

const profileMock: EmailProfile = {
  Email: 'user@example.com',
};

const secret = 'SECRET';

jest.mock('../../utilities/useValuesFromRedirectUri');

jest.mock('./useEmailApi');
let mockEmailApi: ReturnType<typeof useEmailApi>;
let sendEmailPromise: TestPromise<EmailProfile>;
let confirmPromise: TestPromise<EmailProfile>;
let quotePromise: TestPromise<IEncryptedMessage>;
let requestPromise: TestPromise<void>;
let attestPromise: TestPromise<IEncryptedMessage>;

async function enterEmail() {
  const input = await screen.findByLabelText('Your email address');
  await userEvent.type(input, 'user@example.com');
}

async function sendEmail() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Send email' }),
  );
}

function expectSendEmailCalled() {
  expect(mockEmailApi.send).toHaveBeenCalledWith({
    email: 'user@example.com',
    wallet: 'purse',
  });
}

function expectQuoteRequested() {
  expect(mockEmailApi.quote).toHaveBeenCalledWith({});
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

function expectConfirmCalledWith(secret: string) {
  expect(mockEmailApi.confirm).toHaveBeenCalledWith({ secret });
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
    await screen.findByLabelText('Your email address'),
  ).toBeInTheDocument();
}

function expectAttestationRequested() {
  expect(mockEmailApi.requestAttestation).toHaveBeenCalledWith({
    message: { signed: 'quote' },
  });
}

async function respondWithQuote() {
  await act(async () => {
    quotePromise.resolve({ quote: '' } as unknown as IEncryptedMessage);
  });
}

describe('Email', () => {
  beforeEach(() => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({});

    sendEmailPromise = makeTestPromise();
    confirmPromise = makeTestPromise();
    quotePromise = makeTestPromise();
    requestPromise = makeTestPromise();
    attestPromise = makeTestPromise();

    mockEmailApi = {
      send: sendEmailPromise.jestFn,
      confirm: confirmPromise.jestFn,
      quote: quotePromise.jestFn,
      requestAttestation: requestPromise.jestFn,
      attest: attestPromise.jestFn,
    };
    jest.mocked(useEmailApi).mockReturnValue(mockEmailApi);

    sessionMockReset();

    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.mocked(console.error).mockRestore();
  });

  it('should go through the happy path until email is sent', async () => {
    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterEmail();
    await sendEmail();
    expectIsProcessing(container);

    expectSendEmailCalled();

    await act(async () => {
      sendEmailPromise.resolve({ Email: 'user@example.com' });
    });

    expectIsNotProcessing(container);

    expect(await screen.findByText('Email sent')).toBeInTheDocument();
  });

  it('should show an error when sendEmail fails', async () => {
    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);

    await enterEmail();
    await sendEmail();
    expectIsProcessing(container);

    expectSendEmailCalled();

    await act(async () => {
      sendEmailPromise.reject(new InvalidEmail());
    });

    expectIsNotProcessing(container);

    expect(
      await screen.findByText('Incorrect email format, please review.'),
    ).toBeInTheDocument();
  });

  it('should finish the happy path after authentication', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith(secret);

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

  it('should show authentication error', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);

    expectConfirmCalledWith(secret);

    await act(async () => {
      confirmPromise.reject(new Error('authentication'));
    });

    expect(
      await screen.findByText('This link has expired.'),
    ).toBeInTheDocument();

    expect(
      screen.queryByRole('button', { name: 'Continue in Wallet' }),
    ).not.toBeInTheDocument();

    await tryAgain();
    await expectStartOver();
  });

  it('should show error when quote fails', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith(secret);

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
    await expectStartOver();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should show an error when the wallet communication fails', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith(secret);

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
    await expectStartOver();
  });

  // eslint-disable-next-line jest/expect-expect
  it('should show an error when there’s an error in Sporran', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith(secret);

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
    await expectStartOver();
  });

  it('should advice when the popup is closed', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith(secret);

    await act(async () => {
      confirmPromise.resolve(profileMock);
    });

    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ popup: 'closed' });
    expect(mockEmailApi.requestAttestation).toHaveBeenCalledWith({
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
    expect(mockEmailApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice about the slow attestation', async () => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith(secret);

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
