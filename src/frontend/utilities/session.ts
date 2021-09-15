import { IDidDetails, IMessage } from '@kiltprotocol/types';
import { createLightDidDetails } from './did';

// TODO: switch to IEncryptedMessage
interface PubSubSession {
  listen: (callback: (message: IMessage) => Promise<void>) => Promise<void>;
  close: () => Promise<void>;
  send: (message: IMessage) => Promise<void>;
  account: IDidDetails['did'];
}

interface InjectedWindowProvider {
  startSession: (
    origin: string,
    account: IDidDetails['did'],
  ) => Promise<PubSubSession>;
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

  const { did } = createLightDidDetails(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  );
  const dAppName = 'SocialKYC Demo';

  return await provider.startSession(dAppName, did);
}
