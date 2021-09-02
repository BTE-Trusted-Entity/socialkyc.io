import Hapi from '@hapi/hapi';
import inert from '@hapi/inert';
import pino from 'hapi-pino';

import { configuration } from './utilities/configuration';
import { request } from './endpoints/sendEmail';
import { confirmationHtml } from './endpoints/confirmationHtml';
import { attestation } from './endpoints/attestation';
import { staticFiles } from './endpoints/staticFiles';
import { configureAuthentication } from './utilities/configureAuthentication';

const server = Hapi.server({
  port: configuration.port,
  host: '0.0.0.0',
});

async function stop() {
  await server.stop({ timeout: 3000 });
}

const logger = {
  plugin: pino,
  options: {
    prettyPrint: !configuration.isProduction,
    ignoreTags: ['noLogs'],
  },
};

(async () => {
  await server.register(inert);
  await server.register(logger);
  await configureAuthentication(server);

  server.route(staticFiles);
  server.route(request);
  server.route(confirmationHtml);
  server.route(attestation);

  await server.start();
  console.log(`Server running on ${server.info.uri}`);
})();

process.on('SIGINT', async () => {
  await stop();
});

process.on('SIGTERM', async () => {
  await stop();
});

process.on('unhandledRejection', async (error) => {
  console.log(error);
  await stop();
  process.exit(1);
});
