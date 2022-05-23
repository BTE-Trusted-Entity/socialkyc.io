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
import { InvalidEmail } from '../../../backend/email/requestAttestationEmailApi';
import { useValuesFromRedirectUri } from '../../utilities/useValuesFromRedirectUri';

import { useEmailApi } from './useEmailApi';
import { Email } from './Email';

jest.mock('../../utilities/useValuesFromRedirectUri');

jest.mock('./useEmailApi');
let mockEmailApi: ReturnType<typeof useEmailApi>;
let quotePromise: TestPromise<IEncryptedMessage>;
let requestPromise: TestPromise<void>;
let confirmPromise: TestPromise<undefined>;
let attestPromise: TestPromise<IEncryptedMessage>;

async function enterEmail() {
  const input = await screen.findByLabelText('Your email address');
  await userEvent.type(input, 'user@example.com');
}

function expectQuoteRequested() {
  expect(mockEmailApi.quote).toHaveBeenCalledWith({
    email: 'user@example.com',
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

function expectConfirmCalledWith(secret: string) {
  expect(mockEmailApi.confirm).toHaveBeenCalledWith({ secret });
}

function expectQuoteIsSent() {
  expect(sessionMock.send).toHaveBeenCalledWith({ quote: '' });
}

async function anchoringInProgress() {
  expect(
    await screen.findByText('Anchoring credential on KILT blockchain'),
  ).toBeInTheDocument();
}

async function tryAgain() {
  await userEvent.click(
    await screen.findByRole('button', { name: 'Try again' }),
  );
}

async function respondWithQuote() {
  await act(async () => {
    quotePromise.resolve({ quote: '' } as unknown as IEncryptedMessage);
  });
}

describe('Email', () => {
  beforeEach(() => {
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({});

    quotePromise = makeTestPromise();
    requestPromise = makeTestPromise();
    confirmPromise = makeTestPromise();
    attestPromise = makeTestPromise();

    mockEmailApi = {
      quote: quotePromise.jestFn,
      requestAttestation: requestPromise.jestFn,
      attest: attestPromise.jestFn,
      confirm: confirmPromise.jestFn,
    };
    jest.mocked(useEmailApi).mockReturnValue(mockEmailApi);

    sessionMockReset();

    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.mocked(console.error).mockRestore();
  });

  it('should go through the happy path', async () => {
    const { container } = render(<Email session={sessionMock} />);

    await enterEmail();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ signed: 'quote' });
    expect(mockEmailApi.requestAttestation).toHaveBeenCalledWith({
      message: { signed: 'quote' },
      wallet: 'purse',
    });

    await act(async () => {
      requestPromise.resolve();
      await listenerPromise;
      sessionMockSendPromise.resolve(undefined);
    });

    expectIsNotProcessing(container);
    expect(await screen.findByText('Email sent')).toBeInTheDocument();
  });

  it('should show error when quote fails', async () => {
    const { container } = render(<Email session={sessionMock} />);

    await enterEmail();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await act(async () => {
      quotePromise.reject(new Error());
    });
    expect(sessionMock.send).not.toHaveBeenCalled();

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    expect(mockEmailApi.quote).toHaveBeenCalledTimes(1);
    await tryAgain();
    await continueInWallet();
    expect(mockEmailApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should show an error when the wallet communication fails', async () => {
    const { container } = render(<Email session={sessionMock} />);

    await enterEmail();
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
    await continueInWallet();
    expect(mockEmailApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should show an error when there’s an error in Sporran', async () => {
    const { container } = render(<Email session={sessionMock} />);

    await enterEmail();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ error: 'unknown' });
    expect(mockEmailApi.requestAttestation).toHaveBeenCalledWith({
      message: { error: 'unknown' },
      wallet: 'purse',
    });

    await act(async () => {
      requestPromise.reject(new Error('unknown'));
      await listenerPromise;
      sessionMockSendPromise.resolve(undefined);
    });

    expectIsNotProcessing(container);
    await expectSomethingWrong();

    await tryAgain();
    await continueInWallet();
    expect(mockEmailApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should advice when the popup is closed', async () => {
    const { container } = render(<Email session={sessionMock} />);

    await enterEmail();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ popup: 'closed' });
    expect(mockEmailApi.requestAttestation).toHaveBeenCalledWith({
      message: { popup: 'closed' },
      wallet: 'purse',
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

  it('should show an error when email sending fails', async () => {
    const { container } = render(<Email session={sessionMock} />);

    await enterEmail();
    await continueInWallet();
    expectIsProcessing(container);
    expectQuoteRequested();

    await respondWithQuote();
    expectQuoteIsSent();

    const listenerPromise = callSessionListenerWith({ message: 'quote' });
    expect(mockEmailApi.requestAttestation).toHaveBeenCalledWith({
      message: { message: 'quote' },
      wallet: 'purse',
    });

    await act(async () => {
      requestPromise.reject(new InvalidEmail());
      await listenerPromise;
      sessionMockSendPromise.resolve(undefined);
    });

    expectIsNotProcessing(container);
    expect(
      await screen.findByText('Incorrect email format, please review.'),
    ).toBeInTheDocument();

    await continueInWallet();
    expect(mockEmailApi.quote).toHaveBeenCalledTimes(2);
  });

  it('should finish the happy path after confirmation', async () => {
    const secret = 'SECRET';
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith(secret);

    await act(async () => {
      confirmPromise.resolve(undefined);
    });
    await anchoringInProgress();

    await act(async () => {
      attestPromise.resolve({ done: '' } as unknown as IEncryptedMessage);
    });
    expect(await screen.findByText('Credential is ready')).toBeInTheDocument();

    expect(sessionMock.send).not.toHaveBeenCalled();
    await userEvent.click(
      await screen.findByRole('button', { name: 'Show credential in wallet' }),
    );
    expect(sessionMock.send).toHaveBeenCalledTimes(1);
  });

  it('should advice about the slow attestation', async () => {
    jest.useFakeTimers();

    const secret = 'SECRET';
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith(secret);

    await act(async () => {
      confirmPromise.resolve(undefined);
    });
    await anchoringInProgress();

    jest.runAllTimers();

    expect(
      await screen.findByText('Anchoring is taking longer than expected.'),
    ).toBeInTheDocument();
  });

  it('should show an error when the secret is expired', async () => {
    jest.useFakeTimers();

    const secret = 'SECRET';
    jest.mocked(useValuesFromRedirectUri).mockReturnValue({ secret });

    const { container } = render(<Email session={sessionMock} />);

    expectIsNotProcessing(container);
    expectConfirmCalledWith(secret);

    await act(async () => {
      confirmPromise.reject(new Error('expired'));
    });

    expect(
      await screen.findByText('This link has expired.'),
    ).toBeInTheDocument();
  });
});
