import { init, connect as kiltConnect } from '@kiltprotocol/core';

import { configuration } from './configuration';
import { logger } from './logger';
import { trackConnectionState } from './trackConnectionState';

export async function initKilt(): Promise<void> {
  await init();
}

export const blockchainConnectionState = trackConnectionState(60 * 1000);

export async function disconnectHandler(value?: string) {
  blockchainConnectionState.off();
  logger.warn(value, 'Received disconnect event from the blockchain');
}

export async function connect() {
  const api = await kiltConnect(configuration.blockchainEndpoint);
  api.on('disconnected', disconnectHandler);
  api.on('connected', () => blockchainConnectionState.on());
  api.on('error', (error) => logger.error(error));
}
