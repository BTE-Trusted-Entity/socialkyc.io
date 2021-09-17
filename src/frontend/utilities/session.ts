import ky from 'ky';
import { IDidDetails, IEncryptedMessage } from '@kiltprotocol/types';

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
    dAppDID: IDidDetails['did'],
    challenge: string,
  ) => Promise<PubSubSession>;
  name: string;
  version: string;
  specVersion: '0.1';
}

const apiWindow = window as unknown as {
  kilt: { sporran?: InjectedWindowProvider };
};

export async function getSession(): Promise<PubSubSession> {
  const provider = apiWindow.kilt.sporran;
  if (!provider) {
    throw new Error('No provider');
  }

  const did = (await ky.get('/did').text()) as IDidDetails['did'];
  const dAppName = 'SocialKYC Demo';

  return await provider.startSession(
    dAppName,
    did,
    '0123456789012345678901234', // TODO: real challenge
  );
}
