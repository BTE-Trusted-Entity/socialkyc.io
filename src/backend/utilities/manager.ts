import Hapi from '@hapi/hapi';
import exiting from 'exiting';

import { configuration } from './configuration';

const { isProduction, port } = configuration;

export const server = Hapi.server({
  port,
  host: '127.0.0.1',
  uri: configuration.baseUri,
  debug: isProduction ? false : undefined,
  routes: { security: true },
});

export const manager = exiting.createManager(server);
