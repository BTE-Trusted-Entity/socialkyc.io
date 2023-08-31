import { connect } from '@kiltprotocol/sdk-js';

import { configuration } from './configuration';
import { logger } from './logger';
import { trackConnectionState } from './trackConnectionState';

let initKiltMemoized: Promise<void> | undefined;

async function initKiltInternal(): Promise<void> {
  const api = await connect(configuration.blockchainEndpoint);
  api.on('disconnected', disconnectHandler);
  api.on('connected', () => blockchainConnectionState.on());
  api.on('error', (error) => logger.error(error));
  blockchainConnectionState.on();
}

export async function initKilt(): Promise<void> {
  if (!initKiltMemoized) {
    initKiltMemoized = initKiltInternal();
  }
  return initKiltMemoized;
}

export const blockchainConnectionState = trackConnectionState(60 * 1000);

export async function disconnectHandler(value?: string) {
  blockchainConnectionState.off();
  logger.warn(value, 'Received disconnect event from the blockchain');
}
