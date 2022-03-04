import { init } from '@kiltprotocol/core';
import { BlockchainApiConnection } from '@kiltprotocol/chain-helpers';

import { configuration } from './configuration';
import { logger } from './logger';
import { trackConnectionState } from './trackConnectionState';

export async function initKilt(): Promise<void> {
  await init({ address: configuration.blockchainEndpoint });
}

export const blockchainConnectionState = trackConnectionState(60 * 1000);

export async function disconnectHandler(value?: string) {
  blockchainConnectionState.off();
  logger.warn(value, 'Received disconnect event from the blockchain');
}

export async function connect() {
  const { api } = await BlockchainApiConnection.getConnectionOrConnect();
  api.on('disconnected', disconnectHandler);
  api.on('connected', () => blockchainConnectionState.on());
}
