import { connect } from '@kiltprotocol/sdk-js';

import { configuration } from './configuration';
import { logger } from './logger';
import { trackConnectionState } from './trackConnectionState';

export async function initKilt(): Promise<void> {
  // shouldn't this check first if it is already connected?

  // something like: 
  // const api = ConfigService.isSet('api')
  //   ? ConfigService.get('api')
  //   : await connect(configuration.blockchainEndpoint);

  const api = await connect(configuration.blockchainEndpoint)
  api.on('disconnected', disconnectHandler);
  api.on('connected', () => blockchainConnectionState.on());
  api.on('error', (error) => logger.error(error));
}

export const blockchainConnectionState = trackConnectionState(60 * 1000);

export async function disconnectHandler(value?: string) {
  blockchainConnectionState.off();
  logger.warn(value, 'Received disconnect event from the blockchain');
}
