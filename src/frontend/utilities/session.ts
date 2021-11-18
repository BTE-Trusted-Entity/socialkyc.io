import { IDidDetails, IEncryptedMessage } from '@kiltprotocol/types';

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
  identity: IDidDetails['did'];
  encryptedChallenge: string;
  nonce: string;
}

interface InjectedWindowProvider {
  startSession: (
    dAppName: string,
    dAppDid: IDidDetails['did'],
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
  const { did, challenge, sessionId } = await getSessionValues();
  const dAppName = 'SocialKYC';

  const session = await provider.startSession(dAppName, did, challenge);

  const { identity, encryptedChallenge, nonce } = session;
  await checkSession({ identity, encryptedChallenge, nonce, sessionId });

  return { ...session, sessionId };
}
