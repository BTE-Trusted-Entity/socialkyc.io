import Hapi from '@hapi/hapi';
import inert from '@hapi/inert';
import pino from 'hapi-pino';
import exiting from 'exiting';

import { configuration } from './utilities/configuration';
import { request } from './endpoints/sendEmail';
import { confirmationHtml } from './endpoints/confirmationHtml';
import { attestation } from './endpoints/attestation';
import { staticFiles } from './endpoints/staticFiles';
import { liveness } from './endpoints/liveness';
import { quote } from './endpoints/quote';
import { challenge } from './endpoints/challenge';
import { verify } from './endpoints/verify';
import { requestClaims } from './endpoints/requestClaims';
import { configureAuthentication } from './utilities/configureAuthentication';
import { configureDevErrors } from './utilities/configureDevErrors';
import { fullDidPromise } from './utilities/fullDid';

const server = Hapi.server({
  port: configuration.port,
  host: '0.0.0.0',
  debug: configuration.isProduction ? false : undefined,
  routes: { security: true },
});
const manager = exiting.createManager(server);

const logger = {
  plugin: pino,
  options: {
    prettyPrint: !configuration.isProduction,
    ignoreTags: ['noLogs'],
  },
};

(async () => {
  await fullDidPromise;

  await server.register(inert);
  await server.register(logger);
  await configureAuthentication(server);
  await configureDevErrors(server);

  server.route(liveness);
  server.route(staticFiles);
  server.route(challenge);
  server.route(quote);
  server.route(request);
  server.route(confirmationHtml);
  server.route(attestation);
  server.route(requestClaims);
  server.route(verify);

  await manager.start();
})();
