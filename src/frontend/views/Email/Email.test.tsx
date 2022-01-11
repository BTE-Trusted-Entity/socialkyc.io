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

import { useEmailApi } from './useEmailApi';
import { Email } from './Email';

const sessionMock: Session = {
  encryptionKeyId: 'encryptionKeyId',
  encryptedChallenge: 'encryptedChallenge',
  nonce: 'nonce',
  send: jest.fn(),
  close: jest.fn(),
  listen: jest.fn(),
  sessionId: 'foo',
};

jest.mock('./useEmailApi', () => ({ useEmailApi: jest.fn() }));
const mockEmailApi: ReturnType<typeof useEmailApi> = {
  quote: jest.fn(),
  requestAttestation: jest.fn(),
  attest: jest.fn(),
  confirm: jest.fn(),
};
jest.mocked(useEmailApi).mockReturnValue(mockEmailApi);

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
  userEvent.click(await screen.findByRole('button', { name: 'Try again' }));
}

describe('Email', () => {
  let quotePromise = makeControlledPromise<IEncryptedMessage>();
  let sendPromise = makeControlledPromise<void>();
  let requestPromise = makeControlledPromise<string>();
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
      .mocked(mockEmailApi.quote)
      .mockReset()
      .mockReturnValue(quotePromise.promise);

    requestPromise = makeControlledPromise<string>();
    jest
      .mocked(mockEmailApi.requestAttestation)
      .mockReset()
      .mockReturnValue(requestPromise.promise);

    confirmPromise = makeControlledPromise<undefined>();
    jest
      .mocked(mockEmailApi.confirm)
      .mockReset()
      .mockReturnValue(confirmPromise.promise);

    attestPromise = makeControlledPromise<IEncryptedMessage>();
    jest
      .mocked(mockEmailApi.attest)
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
    });

    await act(async () => {
      requestPromise.resolve('PASS');
      await listenerPromise;
      sendPromise.resolve(undefined);
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
      sendPromise.reject(new Error('closed'));
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
    });

    await act(async () => {
      requestPromise.reject(new Error('400: send email failed'));
      await listenerPromise;
      sendPromise.resolve(undefined);
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
    const { container } = render(
      <MemoryRouter
        initialEntries={[paths.emailConfirmation.replace(':secret', secret)]}
      >
        <Email session={sessionMock} />
      </MemoryRouter>,
    );

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
    userEvent.click(
      await screen.findByRole('button', { name: 'Show credential in wallet' }),
    );
    expect(sessionMock.send).toHaveBeenCalledTimes(1);
  });

  it('should advice about the slow attestation', async () => {
    jest.useFakeTimers();

    const secret = 'SECRET';
    const { container } = render(
      <MemoryRouter
        initialEntries={[paths.emailConfirmation.replace(':secret', secret)]}
      >
        <Email session={sessionMock} />
      </MemoryRouter>,
    );

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
    const { container } = render(
      <MemoryRouter
        initialEntries={[paths.emailConfirmation.replace(':secret', secret)]}
      >
        <Email session={sessionMock} />
      </MemoryRouter>,
    );

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
