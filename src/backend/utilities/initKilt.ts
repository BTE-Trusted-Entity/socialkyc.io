import { init } from '@kiltprotocol/core';
import { configuration } from './configuration';

export async function initKilt(): Promise<true> {
  await init({ address: configuration.blockchainEndpoint });
  return true;
}
