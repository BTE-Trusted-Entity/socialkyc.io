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

  while (true) {
    try {
      await reConnect();
      blockchainConnectionState.on();
      break;
    } catch (error) {
      logger.error(error, 'Cannot reconnect to the blockchain');
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}

export async function reConnect() {
  const { api } = await BlockchainApiConnection.getConnectionOrConnect();
  api.once('disconnected', disconnectHandler);
}
