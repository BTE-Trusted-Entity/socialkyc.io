import Hapi from '@hapi/hapi';
import exiting from 'exiting';
import * as fs from 'fs';

import { configuration } from './configuration';

const { isProduction, port } = configuration;

var tls = {
  key: fs.readFileSync('localhost-key.pem'),
  cert: fs.readFileSync('localhost.pem'),
};
export const server = Hapi.server({
  port,
  host: '127.0.0.1',
  uri: configuration.baseUri,
  debug: isProduction ? false : undefined,
  routes: { security: true },
  tls,
});

export const manager = exiting.createManager(server);
