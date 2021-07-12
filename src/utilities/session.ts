import { IMessage, IPublicIdentity } from '@kiltprotocol/types';
import { Identity } from '@kiltprotocol/core';

// TODO: switch to IEncryptedMessage
interface PubSubSession {
  listen: (callback: (message: IMessage) => Promise<void>) => Promise<void>;
  close: () => Promise<void>;
  send: (message: IMessage) => Promise<void>;
  account: IPublicIdentity;
}

interface InjectedWindowProvider {
  startSession: (
    origin: string,
    account: IPublicIdentity,
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

  const demoIdentity = Identity.buildFromMnemonic(
    'receive clutch item involve chaos clutch furnace arrest claw isolate okay together',
  ).getPublicIdentity();
  const demoName = 'SocialKYC Demo';

  return await provider.startSession(demoName, demoIdentity);
}
