import { init } from '@kiltprotocol/core';

export async function initKilt(): Promise<true> {
  await init({ address: 'wss://peregrine.kilt.io' });
  return true;
}
