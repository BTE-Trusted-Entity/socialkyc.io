import { init } from '@kiltprotocol/core';

export async function initKilt(): Promise<void> {
  await init({ address: 'wss://peregrine.kilt.io' });
}
