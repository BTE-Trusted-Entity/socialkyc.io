import { IDidKeyDetails, IEncryptedMessage } from '@kiltprotocol/types';

import {
  checkSession,
  getSessionValues,
} from '../../backend/endpoints/challengeApi';

interface PubSubSession {
  listen: (
    callback: (message: IEncryptedMessage) => Promise<void>,
  ) => Promise<void>;
  close: () => Promise<void>;
  send: (message: IEncryptedMessage) => Promise<void>;
  encryptionKeyId: IDidKeyDetails['id'];
  encryptedChallenge: string;
  nonce: string;
}

interface InjectedWindowProvider {
  startSession: (
    dAppName: string,
    dAppEncryptionKeyId: IDidKeyDetails['id'],
    challenge: string,
  ) => Promise<PubSubSession>;
  name: string;
  version: string;
  specVersion: '0.1';
}

export const apiWindow = window as unknown as {
  kilt: { sporran?: InjectedWindowProvider };
};

export type Session = PubSubSession & {
  sessionId: string;
};

export async function getSession(): Promise<Session> {
  const provider = apiWindow.kilt.sporran;
  if (!provider) {
    throw new Error('No provider');
  }
  const { dAppEncryptionKeyId, challenge, sessionId } =
    await getSessionValues();
  const dAppName = 'SocialKYC';

  const session = await provider.startSession(
    dAppName,
    dAppEncryptionKeyId,
    challenge,
  );

  const { encryptionKeyId, encryptedChallenge, nonce } = session;
  await checkSession({
    encryptionKeyId,
    encryptedChallenge,
    nonce,
    sessionId,
  });

  return { ...session, sessionId };
}
