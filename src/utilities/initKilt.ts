import { init } from '@kiltprotocol/core';

export async function initKilt(): Promise<void> {
  await init({ address: 'wss://kilt-peregrine-k8s.kilt.io' });
}
