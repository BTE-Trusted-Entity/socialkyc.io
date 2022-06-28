import { DidResourceUri, IEncryptedMessage } from '@kiltprotocol/types';

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
  // TODO: Update to encryptionKeyUri after PubSubSession is updated in Sporran
  encryptionKeyId: DidResourceUri;
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
  specVersion: '0.1';
}

export const apiWindow = window as unknown as {
  kilt: Record<string, InjectedWindowProvider>;
};

export class Rejection extends Error {}

export class ClosedRejection extends Rejection {}

export class ExplicitRejection extends Rejection {}

export class UnauthorizedRejection extends Rejection {}

export type Session = PubSubSession & {
  sessionId: string;
  name: string;
  wallet: string;
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

    const {
      encryptionKeyId: encryptionKeyUri,
      encryptedChallenge,
      nonce,
    } = session;
    await checkSession(
      {
        encryptionKeyUri,
        encryptedChallenge,
        nonce,
      },
      sessionId,
    );

    const { name } = provider;

    return { ...session, sessionId, name, wallet };
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
