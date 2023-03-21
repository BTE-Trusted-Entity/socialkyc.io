import { DidResourceUri, IEncryptedMessage } from '@kiltprotocol/sdk-js';

import {
  checkSession,
  getSessionValues,
} from '../../backend/endpoints/sessionApi';

import { exceptionToError } from './exceptionToError';

interface PubSubSession {
  listen: (
    callback: (message: IEncryptedMessage) => Promise<void>,
  ) => Promise<void>;
  close: () => Promise<void>;
  send: (message: IEncryptedMessage) => Promise<void>;
  encryptionKeyUri: DidResourceUri;
  encryptedChallenge: string;
  nonce: string;
}

interface InjectedWindowProvider {
  startSession: (
    dAppName: string,
    dAppEncryptionKeyUri: DidResourceUri,
    challenge: string,
  ) => Promise<PubSubSession>;
  name: string;
  version: string;
  specVersion: '3.0';
}

export const apiWindow = window as unknown as {
  kilt: Record<string, InjectedWindowProvider>;
};

export function getCompatibleExtensions(): Array<string> {
  return Object.entries(apiWindow.kilt)
    .filter(([, provider]) => provider.specVersion.startsWith('3.'))
    .map(([name]) => name);
}

export class Rejection extends Error {}

export class ClosedRejection extends Rejection {}

export class ExplicitRejection extends Rejection {}

export class UnauthorizedRejection extends Rejection {}

export type Session = PubSubSession & {
  sessionId: string;
  name: string;
  wallet: string;
};

type CompatibleMessage = IEncryptedMessage & {
  receiverKeyId?: IEncryptedMessage['receiverKeyUri'];
  senderKeyId?: IEncryptedMessage['senderKeyUri'];
};

export async function getSession(
  provider: InjectedWindowProvider,
  wallet: string,
): Promise<Session> {
  if (!provider) {
    throw new Error('No provider');
  }
  try {
    window.sessionStorage.setItem('wallet', wallet);

    const { dAppEncryptionKeyUri, challenge, sessionId } =
      await getSessionValues();
    const dAppName = 'SocialKYC';

    const session = await provider.startSession(
      dAppName,
      dAppEncryptionKeyUri,
      challenge,
    );

    const { encryptionKeyUri, encryptedChallenge, nonce } = session;
    await checkSession(
      {
        encryptionKeyUri,
        encryptedChallenge,
        nonce,
      },
      sessionId,
    );

    async function send(message: CompatibleMessage): Promise<void> {
      message.receiverKeyId = message.receiverKeyUri;
      message.senderKeyId = message.senderKeyUri;
      return session.send(message);
    }

    async function listen(
      callback: (message: CompatibleMessage) => Promise<void>,
    ) {
      return session.listen(async (message: CompatibleMessage) => {
        message.senderKeyUri = message.senderKeyUri || message.senderKeyId;
        message.receiverKeyUri =
          message.receiverKeyUri || message.receiverKeyId;
        return callback(message);
      });
    }

    const { name } = provider;

    return { ...session, send, listen, sessionId, name, wallet };
  } catch (exception) {
    const { message } = exceptionToError(exception);
    if (message.includes('closed')) {
      throw new ClosedRejection(message);
    }
    if (message.includes('Not authorized')) {
      throw new UnauthorizedRejection(message);
    }
    throw exception;
  }
}
