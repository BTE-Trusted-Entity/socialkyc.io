import ky from 'ky';
import { IDidDetails, IEncryptedMessage } from '@kiltprotocol/types';
import { paths } from '../../backend/endpoints/paths';

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

export async function getSession(): Promise<PubSubSession> {
  const provider = apiWindow.kilt.sporran;
  if (!provider) {
    throw new Error('No provider');
  }

  const { did, challenge, key } = await ky.get(paths.challenge).json();
  const dAppName = 'SocialKYC Demo';

  const session = await provider.startSession(dAppName, did, challenge);

  const { identity, encryptedChallenge, nonce } = session;
  await ky.post(paths.challenge, {
    json: { identity, encryptedChallenge, nonce, key },
  });

  return session;
}
